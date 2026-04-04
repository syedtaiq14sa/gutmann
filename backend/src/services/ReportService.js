const { supabaseAdmin } = require('../config/supabase');

class ReportService {
  async generateProjectSummary(dateRange = 'month') {
    const startDate = this.getStartDate(dateRange);

    const { data: projects, error } = await supabaseAdmin
      .from('inquiries')
      .select('*, quotations(final_price, estimated_cost)')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    return {
      totalProjects: projects.length,
      approvedProjects: projects.filter(p => p.status === 'approved').length,
      rejectedProjects: projects.filter(p => p.status === 'rejected').length,
      totalRevenue: projects
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + (p.quotations?.[0]?.final_price || 0), 0),
      pipelineValue: projects
        .filter(p => !['approved', 'rejected'].includes(p.status))
        .reduce((sum, p) => sum + (p.quotations?.[0]?.final_price || 0), 0),
      averageProjectValue: projects.length > 0
        ? projects.reduce((sum, p) => sum + (p.quotations?.[0]?.final_price || 0), 0) / projects.length
        : 0,
      bottleneckCount: projects.filter(p => p.bottleneck_flag).length
    };
  }

  async generateBottleneckReport() {
    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .select('id, inquiry_number, status, updated_at, client_name')
      .eq('bottleneck_flag', true)
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async generateWorkflowMetrics() {
    const { data: transitions, error } = await supabaseAdmin
      .from('workflow_transitions')
      .select('from_status, to_status, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const stageMetrics = {};
    transitions.forEach(t => {
      if (!stageMetrics[t.from_status]) {
        stageMetrics[t.from_status] = { count: 0, totalTime: 0 };
      }
      stageMetrics[t.from_status].count++;
    });

    return stageMetrics;
  }

  getStartDate(range) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    switch (range) {
      case 'week': return new Date(year, month, day - 7);
      case 'month': return new Date(year, month - 1, day);
      case 'quarter': return new Date(year, month - 3, day);
      case 'year': return new Date(year - 1, month, day);
      default: return new Date(year, month - 1, day);
    }
  }
}

module.exports = new ReportService();
