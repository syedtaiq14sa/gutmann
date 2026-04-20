const { supabaseAdmin } = require('../config/supabase');
const WorkflowEngine = require('../services/WorkflowEngine');
const { transitionStage } = require('../services/StageTransitionService');
const { sanitizeInquiryForRole } = require('../utils/projectVisibility');

const getProjects = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    let query = supabaseAdmin
      .from('inquiries')
      .select('*, quotations(*)')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .select('*, quotations(*), qc_reviews(*), technical_reviews(*), project_status(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(sanitizeInquiryForRole(data, req.user.role));
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

const createProject = async (req, res) => {
  try {
    const { client_name, project_description, location, contact_info } = req.body;

    if (!client_name || !project_description) {
      return res.status(400).json({ error: 'Client name and project description are required' });
    }

    const inquiry_number = `INQ-${Date.now()}`;

    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .insert([{
        inquiry_number,
        client_name,
        project_description,
        location,
        contact_info,
        status: 'received',
        created_by: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const { data: project } = await supabaseAdmin
      .from('inquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const canTransition = WorkflowEngine.canTransition(project.status, status, req.user.role);
    if (!canTransition) {
      return res.status(400).json({ error: 'Invalid workflow transition' });
    }

    const data = await transitionStage({
      inquiryId: id,
      fromStatus: project.status,
      toStatus: status,
      transitionedBy: req.user.id,
      notes,
      fromStartedAtFallback: project.updated_at || project.created_at
    });

    if (req.io) {
      req.io.emit('project-status-updated', { projectId: id, status });
    }

    res.json(data);
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update project status' });
  }
};

module.exports = { getProjects, getProjectById, createProject, updateProjectStatus };
