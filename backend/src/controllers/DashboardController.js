const { supabaseAdmin } = require('../config/supabase');
const STAGE_ORDER = [
  'received',
  'qc_review',
  'technical_review',
  'estimation',
  'ceo_approval',
  'sales_followup',
  'client_review',
  'approved',
  'supply_chain',
  'rejected'
];

const ROLE_STAGE_RANK = {
  qc: STAGE_ORDER.indexOf('qc_review'),
  technical: STAGE_ORDER.indexOf('technical_review'),
  estimation: STAGE_ORDER.indexOf('estimation')
};

const ROLE_VISIBLE_STATUSES = {
  qc: ['received', 'qc_review', 'technical_review', 'estimation', 'ceo_approval', 'sales_followup', 'client_review', 'approved', 'supply_chain', 'rejected'],
  technical: ['technical_review', 'estimation', 'ceo_approval', 'sales_followup', 'client_review', 'approved', 'supply_chain', 'rejected'],
  estimation: ['estimation', 'ceo_approval', 'sales_followup', 'client_review', 'approved', 'supply_chain', 'rejected'],
  ceo: ['received', 'qc_review', 'technical_review', 'estimation', 'ceo_approval', 'sales_followup', 'client_review', 'approved', 'supply_chain', 'rejected'],
  supply_chain: ['supply_chain', 'sales_followup', 'rejected']
};

const getVisibilityGroup = (role, status) => {
  if (ROLE_STAGE_RANK[role] === undefined) return 'active';
  const statusRank = STAGE_ORDER.indexOf(status);
  const roleRank = ROLE_STAGE_RANK[role];

  // Active: current role-owned stage (and its paired revision stage),
  // Completed: progressed beyond this role's stage, Returned: moved backward before this role's stage.
  if (statusRank === -1) return 'active';
  if (statusRank === roleRank || statusRank === roleRank + 1) return 'active';
  if (statusRank > roleRank + 1) return 'completed';
  return 'returned';
};

const getProjects = async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('inquiries')
      .select('*, quotations(final_price, estimated_cost)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (ROLE_VISIBLE_STATUSES[req.user.role]) {
      query = query.in('status', ROLE_VISIBLE_STATUSES[req.user.role]);
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
    const statusFilter = ROLE_VISIBLE_STATUSES[req.user.role] || null;

    let query = supabaseAdmin
      .from('inquiries')
      .select('id, inquiry_number, client_name, status, created_at, bottleneck_flag')
      .order('bottleneck_flag', { ascending: false })
      .order('created_at', { ascending: true });

    if (statusFilter) {
      query = query.in('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    const scopedData = data || [];

    const tasks = scopedData.map(item => ({
      ...item,
      title: item.inquiry_number,
      project_id: item.id,
      stage: item.status,
      priority: item.bottleneck_flag ? 'high' : 'medium',
      visibility_group: getVisibilityGroup(req.user.role, item.status)
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
      { stage: 'Sales Follow-up', count: projects.filter(p => p.status === 'sales_followup').length },
      { stage: 'Client', count: projects.filter(p => p.status === 'client_review').length },
      { stage: 'Approved', count: projects.filter(p => p.status === 'approved').length },
      { stage: 'Supply Chain', count: projects.filter(p => p.status === 'supply_chain').length },
      { stage: 'Rejected', count: projects.filter(p => p.status === 'rejected').length }
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
