const { supabaseAdmin } = require('../config/supabase');
const NotificationService = require('../services/NotificationService');
const { transitionStage } = require('../services/StageTransitionService');

const getPendingApprovals = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .select('*, quotations(*), technical_reviews(*), qc_reviews(*)')
      .eq('status', 'ceo_approval')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch approvals' });
  }
};

const approveQuotation = async (req, res) => {
  try {
    const { inquiry_id, decision, notes, adjusted_price } = req.body;

    if (!inquiry_id || !decision) {
      return res.status(400).json({ error: 'Inquiry ID and decision required' });
    }

    if (!['approved', 'rejected', 'revision'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }

    let newStatus;
    switch (decision) {
      case 'approved': newStatus = 'client_review'; break;
      case 'rejected': newStatus = 'rejected'; break;
      case 'revision': newStatus = 'estimation'; break;
      default: newStatus = 'ceo_approval';
    }

    const { data: inquiry } = await supabaseAdmin
      .from('inquiries')
      .select('*')
      .eq('id', inquiry_id)
      .single();

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    await transitionStage({
      inquiryId: inquiry_id,
      fromStatus: inquiry.status,
      toStatus: newStatus,
      transitionedBy: req.user.id,
      notes,
      fromStartedAtFallback: inquiry.updated_at || inquiry.created_at,
      details: { adjusted_price, decision, feedback: notes }
    });

    if (adjusted_price) {
      await supabaseAdmin
        .from('quotations')
        .update({ final_price: adjusted_price, ceo_adjusted: true })
        .eq('inquiry_id', inquiry_id);
    }

    await supabaseAdmin.from('audit_log').insert([{
      action: `ceo_${decision}`,
      entity_type: 'inquiry',
      entity_id: inquiry_id,
      performed_by: req.user.id,
      details: { notes, adjusted_price, decision }
    }]);

    if (req.io) {
      req.io.emit('project-status-updated', { projectId: inquiry_id, status: newStatus });
    }

    res.json({ message: `Project ${decision} successfully`, status: newStatus });
  } catch (err) {
    console.error('CEO approve error:', err);
    res.status(500).json({ error: 'Failed to process approval' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { data: projects, error } = await supabaseAdmin
      .from('inquiries')
      .select('id, status, created_at, updated_at, quotations(final_price)');

    if (error) throw error;

    const { data: stageLogs } = await supabaseAdmin
      .from('project_status')
      .select('inquiry_id, stage, started_at, completed_at, duration_hours');

    const stageGroups = (stageLogs || []).reduce((acc, row) => {
      if (!acc[row.stage]) acc[row.stage] = [];
      const duration = row.duration_hours ?? (
        row.completed_at && row.started_at
          ? Math.round((new Date(row.completed_at) - new Date(row.started_at)) / (1000 * 60 * 60))
          : null
      );
      if (duration !== null && Number.isFinite(duration)) acc[row.stage].push(duration);
      return acc;
    }, {});

    const departmentAverageTimeHours = Object.entries(stageGroups).map(([stage, values]) => ({
      stage,
      average_hours: values.length ? Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2)) : 0
    }));

    const turnaroundHours = projects
      .map((project) => (new Date(project.updated_at) - new Date(project.created_at)) / (1000 * 60 * 60))
      .filter((value) => Number.isFinite(value) && value >= 0);

    const analytics = {
      totalProjects: projects.length,
      approvedProjects: projects.filter(p => p.status === 'approved').length,
      rejectedProjects: projects.filter(p => p.status === 'rejected').length,
      pendingProjects: projects.filter(p => !['approved', 'rejected'].includes(p.status)).length,
      totalRevenue: projects
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + (p.quotations?.[0]?.final_price || 0), 0),
      pipelineValue: projects
        .filter(p => !['approved', 'rejected'].includes(p.status))
        .reduce((sum, p) => sum + (p.quotations?.[0]?.final_price || 0), 0),
      overallTurnaroundAvgHours: turnaroundHours.length
        ? Number((turnaroundHours.reduce((sum, v) => sum + v, 0) / turnaroundHours.length).toFixed(2))
        : 0,
      departmentAverageTimeHours
    };

    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

module.exports = { getPendingApprovals, approveQuotation, getAnalytics };
