const { supabaseAdmin } = require('../config/supabase');
const NotificationService = require('../services/NotificationService');

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

    await supabaseAdmin
      .from('inquiries')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', inquiry_id);

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
      details: { notes, adjusted_price }
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
      .select('status, created_at, quotations(final_price)');

    if (error) throw error;

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
        .reduce((sum, p) => sum + (p.quotations?.[0]?.final_price || 0), 0)
    };

    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

module.exports = { getPendingApprovals, approveQuotation, getAnalytics };
