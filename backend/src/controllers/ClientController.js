const { supabaseAdmin } = require('../config/supabase');
const NotificationService = require('../services/NotificationService');

// GET /api/client/quotations - Get client's quotations
const getMyQuotations = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .select('*, quotations(*)')
      .eq('client_email', req.user.email)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get client quotations error:', err);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
};

// POST /api/client/:id/accept - Accept quotation
const acceptQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const { data: inquiry, error: fetchError } = await supabaseAdmin
      .from('inquiries')
      .select('*, quotations(*)')
      .eq('id', id)
      .single();

    if (fetchError || !inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    if (inquiry.status !== 'client_review') {
      return res.status(400).json({ error: 'Inquiry is not in client review stage' });
    }

    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from('audit_log').insert([{
      action: 'client_accepted',
      entity_type: 'inquiry',
      entity_id: id,
      performed_by: req.user.id,
      details: { notes }
    }]);

    // Notify CEO and salesperson
    await NotificationService.notifyRole('ceo', `Client accepted quotation for ${inquiry.inquiry_number}`, {
      type: 'approved',
      inquiry_id: id
    });

    if (req.io) {
      req.io.emit('project-status-updated', { projectId: id, status: 'approved' });
    }

    res.json(data);
  } catch (err) {
    console.error('Accept quotation error:', err);
    res.status(500).json({ error: 'Failed to accept quotation' });
  }
};

// POST /api/client/:id/reject - Reject quotation
const rejectQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: inquiry, error: fetchError } = await supabaseAdmin
      .from('inquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    if (inquiry.status !== 'client_review') {
      return res.status(400).json({ error: 'Inquiry is not in client review stage' });
    }

    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from('audit_log').insert([{
      action: 'client_rejected',
      entity_type: 'inquiry',
      entity_id: id,
      performed_by: req.user.id,
      details: { reason }
    }]);

    await NotificationService.notifyRole('ceo', `Client rejected quotation for ${inquiry.inquiry_number}`, {
      type: 'rejected',
      inquiry_id: id,
      reason
    });

    if (req.io) {
      req.io.emit('project-status-updated', { projectId: id, status: 'rejected' });
    }

    res.json(data);
  } catch (err) {
    console.error('Reject quotation error:', err);
    res.status(500).json({ error: 'Failed to reject quotation' });
  }
};

// POST /api/client/:id/negotiate - Request negotiation
const requestNegotiation = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, counter_offer } = req.body;

    const { data: inquiry, error: fetchError } = await supabaseAdmin
      .from('inquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    if (inquiry.status !== 'client_review') {
      return res.status(400).json({ error: 'Inquiry is not in client review stage' });
    }

    await supabaseAdmin.from('audit_log').insert([{
      action: 'client_negotiation_requested',
      entity_type: 'inquiry',
      entity_id: id,
      performed_by: req.user.id,
      details: { message, counter_offer }
    }]);

    await NotificationService.notifyRole('ceo', `Client requested negotiation for ${inquiry.inquiry_number}`, {
      type: 'clarification_needed',
      inquiry_id: id,
      counter_offer,
      message
    });

    res.json({ message: 'Negotiation request submitted successfully' });
  } catch (err) {
    console.error('Negotiate quotation error:', err);
    res.status(500).json({ error: 'Failed to submit negotiation request' });
  }
};

// GET /api/client/status - Get project statuses
const getProjectStatus = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .select('id, inquiry_number, status, client_name, created_at, updated_at')
      .eq('client_email', req.user.email)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get status error:', err);
    res.status(500).json({ error: 'Failed to fetch project status' });
  }
};

module.exports = {
  getMyQuotations,
  acceptQuotation,
  rejectQuotation,
  requestNegotiation,
  getProjectStatus
};
