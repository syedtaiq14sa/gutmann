const { supabaseAdmin } = require('../config/supabase');
const WorkflowEngine = require('../services/WorkflowEngine');
const NotificationService = require('../services/NotificationService');
const { generateInquiryNumber, isBottleneck } = require('../utils/helpers');
const { initializeStage, transitionStage } = require('../services/StageTransitionService');

const STAGE_ADVANCE_REQUIREMENTS = {
  technical_review: {
    next_status: 'estimation',
    checklist: ['requirements_reviewed', 'feasibility_checked', 'risk_assessed'],
    requireFeedback: true
  },
  estimation: {
    next_status: 'ceo_approval',
    checklist: ['costing_completed', 'quotation_reviewed', 'profitability_verified'],
    requireFeedback: true,
    requirePricing: true
  },
  ceo_approval: {
    next_status: 'sales_followup',
    checklist: ['submission_reviewed', 'commercial_terms_reviewed'],
    requireFeedback: true
  },
  client_review: {
    next_status: 'approved',
    checklist: ['client_response_recorded'],
    requireFeedback: true,
    requireClientResponse: true
  }
};

const validateAdvanceRequirements = (currentStatus, newStatus, payload = {}) => {
  const requirement = STAGE_ADVANCE_REQUIREMENTS[currentStatus];
  if (!requirement || requirement.next_status !== newStatus) {
    return null;
  }

  const checklist = payload.checklist || {};
  const missingChecklist = requirement.checklist.filter((key) => !checklist[key]);
  if (missingChecklist.length > 0) {
    return `Missing required checklist items: ${missingChecklist.join(', ')}`;
  }

  const feedback = (payload.feedback || '').trim();
  if (requirement.requireFeedback && !feedback) {
    return 'Feedback/comments are required before moving to the next stage';
  }

  if (requirement.requirePricing) {
    const estimatedCost = Number(payload.estimated_cost);
    const finalPrice = Number(payload.final_price);
    if (!Number.isFinite(estimatedCost) || estimatedCost <= 0 || !Number.isFinite(finalPrice) || finalPrice <= 0) {
      return 'Valid estimated_cost and final_price are required before moving to the next stage';
    }
  }

  if (requirement.requireClientResponse) {
    const clientResponse = (payload.client_response || '').trim();
    if (!clientResponse) {
      return 'Client response is required before moving to the next stage';
    }
    if (!['approved', 'rejected', 'conditional_approval'].includes(clientResponse)) {
      return 'Invalid client response value';
    }
  }

  return null;
};

// POST /api/inquiries - Create new inquiry
const createInquiry = async (req, res) => {
  try {
    const {
      client_name, client_email, client_phone, client_company,
      project_type, project_description, location, budget_range, priority
    } = req.body;

    const inquiry_number = generateInquiryNumber();

    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .insert([{
        inquiry_number,
        client_name,
        client_email,
        client_phone,
        client_company,
        project_type,
        project_description,
        location,
        budget_range,
        priority: priority || 'medium',
        status: 'received',
        created_by: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;

    await initializeStage({
      inquiryId: data.id,
      stage: 'received',
      overrideStartedAt: data.created_at
    });

    // Log audit trail
    await supabaseAdmin.from('audit_log').insert([{
      action: 'inquiry_created',
      entity_type: 'inquiry',
      entity_id: data.id,
      performed_by: req.user.id,
      details: { inquiry_number }
    }]);

    // Notify QC team
    await NotificationService.notifyRoleUsers(
      'qc',
      'New Inquiry Requires Review',
      `New inquiry ${inquiry_number} requires QC review`,
      'review_required',
      data.id
    );

    if (req.io) {
      req.io.emit('new-inquiry', { inquiryId: data.id, inquiry_number });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Create inquiry error:', err);
    res.status(500).json({ error: 'Failed to create inquiry' });
  }
};

// GET /api/inquiries - List all inquiries with filters
const getAllInquiries = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('inquiries')
      .select('*, quotations(final_price, estimated_cost)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // Role-based filtering
    if (req.user.role === 'salesperson') {
      const { data: allInquiries, error: allError } = await query;
      if (allError) throw allError;
      const scoped = (allInquiries || []).filter((row) => row.created_by === req.user.id || row.status === 'sales_followup');
      return res.json({ data: scoped, total: scoped.length, page: parseInt(page), limit: parseInt(limit) });
    } else if (req.user.role === 'qc') {
      query = query.in('status', ['received', 'qc_review', 'technical_review', 'estimation', 'ceo_approval', 'sales_followup', 'client_review', 'approved', 'supply_chain', 'rejected']);
    } else if (req.user.role === 'technical') {
      query = query.in('status', ['technical_review', 'estimation', 'ceo_approval', 'sales_followup', 'client_review', 'approved', 'supply_chain', 'rejected']);
    } else if (req.user.role === 'estimation') {
      query = query.in('status', ['estimation', 'ceo_approval', 'sales_followup', 'client_review', 'approved', 'supply_chain', 'rejected']);
    } else if (req.user.role === 'supply_chain') {
      query = query.in('status', ['supply_chain', 'rejected', 'sales_followup']);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`client_name.ilike.%${search}%,inquiry_number.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Get inquiries error:', err);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
};

// GET /api/inquiries/:id - Get inquiry details
const getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .select('*, quotations(*), qc_reviews(*), technical_reviews(*), project_status(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('Get inquiry error:', err);
    res.status(500).json({ error: 'Failed to fetch inquiry' });
  }
};

// PUT /api/inquiries/:id - Update inquiry
const updateInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_name, client_email, client_phone, client_company,
      project_type, project_description, location, budget_range, priority
    } = req.body;

    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .update({
        client_name, client_email, client_phone, client_company,
        project_type, project_description, location, budget_range, priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    await supabaseAdmin.from('audit_log').insert([{
      action: 'inquiry_updated',
      entity_type: 'inquiry',
      entity_id: id,
      performed_by: req.user.id
    }]);

    res.json(data);
  } catch (err) {
    console.error('Update inquiry error:', err);
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
};

// GET /api/inquiries/:id/history - Get workflow history
const getInquiryHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: history, error } = await supabaseAdmin
      .from('audit_log')
      .select('*')
      .eq('entity_id', id)
      .eq('entity_type', 'inquiry')
      .order('created_at', { ascending: true });

    if (error) throw error;
    const userIds = [...new Set((history || []).map(item => item.performed_by).filter(Boolean))];
    let usersById = {};

    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, name, role, email')
        .in('id', userIds);
      usersById = (users || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});
    }

    const enrichedHistory = (history || []).map(item => ({
      ...item,
      actor: item.performed_by ? usersById[item.performed_by] || null : null
    }));

    res.json(enrichedHistory);
  } catch (err) {
    console.error('Get inquiry history error:', err);
    res.status(500).json({ error: 'Failed to fetch inquiry history' });
  }
};

// PUT /api/inquiries/:id/stage - Move inquiry to next stage
const moveToStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_status, notes, feedback } = req.body;

    const { data: inquiry, error: fetchError } = await supabaseAdmin
      .from('inquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const canMove = WorkflowEngine.canTransition(inquiry.status, new_status, req.user.role);
    if (!canMove) {
      return res.status(400).json({
        error: `Cannot transition from '${inquiry.status}' to '${new_status}' with role '${req.user.role}'`
      });
    }

    const requirementError = validateAdvanceRequirements(inquiry.status, new_status, req.body);
    if (requirementError) {
      return res.status(400).json({ error: requirementError });
    }

    const estimatedCost = req.body.estimated_cost !== undefined && req.body.estimated_cost !== null
      ? Number(req.body.estimated_cost)
      : null;
    const finalPrice = req.body.final_price !== undefined && req.body.final_price !== null
      ? Number(req.body.final_price)
      : null;

    const data = await transitionStage({
      inquiryId: id,
      fromStatus: inquiry.status,
      toStatus: new_status,
      transitionedBy: req.user.id,
      notes: notes || feedback || null,
      fromStartedAtFallback: inquiry.updated_at || inquiry.created_at,
      details: {
        checklist: req.body.checklist || null,
        feedback: req.body.feedback || null,
        decision: req.body.decision || null,
        estimated_cost: estimatedCost,
        final_price: finalPrice,
        client_response: req.body.client_response || null
      }
    });

    if (req.io) {
      req.io.emit('project-status-updated', { projectId: id, status: new_status });
    }

    res.json(data);
  } catch (err) {
    console.error('Move stage error:', err);
    res.status(500).json({ error: 'Failed to update stage' });
  }
};

module.exports = {
  createInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiry,
  getInquiryHistory,
  moveToStage
};
