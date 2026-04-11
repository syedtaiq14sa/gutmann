const { supabaseAdmin } = require('../config/supabase');
const { transitionStage } = require('../services/StageTransitionService');

const getPendingEstimations = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .select('*, technical_reviews(*), quotations(*)')
      .eq('status', 'estimation')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch estimations' });
  }
};

const submitQuotation = async (req, res) => {
  try {
    const { inquiry_id, boq_items, material_cost, labor_cost, overhead_percentage, margin_percentage, notes } = req.body;

    if (!inquiry_id || !material_cost || !labor_cost) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const overhead = (material_cost + labor_cost) * ((overhead_percentage || 15) / 100);
    const subtotal = material_cost + labor_cost + overhead;
    const margin = subtotal * ((margin_percentage || 20) / 100);
    const estimated_cost = subtotal;
    const final_price = subtotal + margin;

    const { data: quotation, error } = await supabaseAdmin
      .from('quotations')
      .insert([{
        inquiry_id,
        estimator_id: req.user.id,
        boq_items: boq_items || [],
        material_cost,
        labor_cost,
        overhead_percentage: overhead_percentage || 15,
        margin_percentage: margin_percentage || 20,
        estimated_cost,
        final_price,
        notes,
        status: 'draft'
      }])
      .select()
      .single();

    if (error) throw error;

    const { data: inquiry } = await supabaseAdmin
      .from('inquiries')
      .select('status, created_at, updated_at')
      .eq('id', inquiry_id);

    const currentInquiry = Array.isArray(inquiry) ? inquiry[0] : inquiry;
    if (!currentInquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    await transitionStage({
      inquiryId: inquiry_id,
      fromStatus: currentInquiry.status,
      toStatus: 'ceo_approval',
      transitionedBy: req.user.id,
      notes,
      fromStartedAtFallback: currentInquiry.updated_at || currentInquiry.created_at,
      details: {
        estimated_cost,
        final_price,
        quotation_id: quotation.id
      }
    });

    if (req.io) {
      req.io.emit('project-status-updated', { projectId: inquiry_id, status: 'ceo_approval' });
    }

    res.status(201).json(quotation);
  } catch (err) {
    console.error('Submit quotation error:', err);
    res.status(500).json({ error: 'Failed to submit quotation' });
  }
};

const updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('quotations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update quotation' });
  }
};

module.exports = { getPendingEstimations, submitQuotation, updateQuotation };
