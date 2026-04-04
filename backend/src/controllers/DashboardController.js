const { supabaseAdmin } = require('../config/supabase');

const getProjects = async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('inquiries')
      .select('*, quotations(final_price, estimated_cost)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (req.user.role === 'salesperson') {
      query = query.eq('created_by', req.user.id);
    } else if (req.user.role === 'qc') {
      query = query.in('status', ['qc_review', 'qc_revision', 'received']);
    } else if (req.user.role === 'technical') {
      query = query.in('status', ['technical_review', 'technical_revision']);
    } else if (req.user.role === 'estimation') {
      query = query.eq('status', 'estimation');
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Dashboard projects error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

const getTasks = async (req, res) => {
  try {
    let statusFilter;
    switch (req.user.role) {
      case 'qc': statusFilter = ['qc_review', 'qc_revision']; break;
      case 'technical': statusFilter = ['technical_review', 'technical_revision']; break;
      case 'estimation': statusFilter = ['estimation']; break;
      case 'ceo': statusFilter = ['ceo_approval']; break;
      default: statusFilter = null;
    }

    let query = supabaseAdmin
      .from('inquiries')
      .select('id, inquiry_number, client_name, status, created_at, bottleneck_flag')
      .order('bottleneck_flag', { ascending: false })
      .order('created_at', { ascending: true });

    if (statusFilter) {
      query = query.in('status', statusFilter);
    }

    if (req.user.role === 'salesperson') {
      query = query.eq('created_by', req.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    const tasks = (data || []).map(item => ({
      ...item,
      title: item.inquiry_number,
      project_id: item.id,
      stage: item.status,
      priority: item.bottleneck_flag ? 'high' : 'medium'
    }));

    res.json(tasks);
  } catch (err) {
    console.error('Tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

const getReports = async (req, res) => {
  try {
    const { range = 'month' } = req.query;

    const { data: projects, error } = await supabaseAdmin
      .from('inquiries')
      .select('status, created_at, quotations(final_price)');

    if (error) throw error;

    const stageDistribution = [
      { stage: 'Received', count: projects.filter(p => p.status === 'received').length },
      { stage: 'QC', count: projects.filter(p => p.status === 'qc_review').length },
      { stage: 'Technical', count: projects.filter(p => p.status === 'technical_review').length },
      { stage: 'Estimation', count: projects.filter(p => p.status === 'estimation').length },
      { stage: 'CEO', count: projects.filter(p => p.status === 'ceo_approval').length },
      { stage: 'Approved', count: projects.filter(p => p.status === 'approved').length }
    ];

    const statusBreakdown = stageDistribution.map(s => ({ name: s.stage, value: s.count }));

    const revenueTimeline = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      const monthProjects = projects.filter(p => {
        const d = new Date(p.created_at);
        return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
      });
      const revenue = monthProjects.reduce((sum, p) => sum + (p.quotations?.[0]?.final_price || 0), 0);
      revenueTimeline.push({ date: monthStr, revenue });
    }

    res.json({ stageDistribution, statusBreakdown, revenueTimeline });
  } catch (err) {
    console.error('Reports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

module.exports = { getProjects, getTasks, getReports };
