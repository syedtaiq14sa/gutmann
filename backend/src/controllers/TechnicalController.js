const { supabaseAdmin } = require('../config/supabase');

const getPendingReviews = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .select('*, technical_reviews(*), qc_reviews(*)')
      .eq('status', 'technical_review')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch technical reviews' });
  }
};

const submitReview = async (req, res) => {
  try {
    const { inquiry_id, system_type, technical_specs, feasibility, estimated_duration, remarks, decision } = req.body;

    if (!inquiry_id || !decision) {
      return res.status(400).json({ error: 'Inquiry ID and decision are required' });
    }

    const { data: review, error: reviewError } = await supabaseAdmin
      .from('technical_reviews')
      .insert([{
        inquiry_id,
        reviewer_id: req.user.id,
        system_type,
        technical_specs: technical_specs || {},
        feasibility,
        estimated_duration,
        remarks,
        status: decision
      }])
      .select()
      .single();

    if (reviewError) throw reviewError;

    const newStatus = decision === 'approved' ? 'estimation' : 'technical_revision';

    await supabaseAdmin
      .from('inquiries')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', inquiry_id);

    if (req.io) {
      req.io.emit('project-status-updated', { projectId: inquiry_id, status: newStatus });
    }

    res.status(201).json(review);
  } catch (err) {
    console.error('Technical submit error:', err);
    res.status(500).json({ error: 'Failed to submit technical review' });
  }
};

const getSystemTypes = async (req, res) => {
  const systemTypes = [
    'HVAC - Central Air',
    'HVAC - Split System',
    'HVAC - VRF/VRV',
    'Plumbing - Commercial',
    'Plumbing - Residential',
    'Electrical - Low Voltage',
    'Electrical - High Voltage',
    'Fire Protection',
    'Building Automation'
  ];
  res.json(systemTypes);
};

module.exports = { getPendingReviews, submitReview, getSystemTypes };
