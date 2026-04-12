const { supabaseAdmin } = require('../config/supabase');
const NotificationService = require('../services/NotificationService');
const { transitionStage } = require('../services/StageTransitionService');
const { getSingleRow } = require('../utils/queryRow');

const getPendingReviews = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .select('*, qc_reviews(*)')
      .eq('status', 'qc_review')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('QC pending error:', err);
    res.status(500).json({ error: 'Failed to fetch QC reviews' });
  }
};

const submitReview = async (req, res) => {
  try {
    const { inquiry_id, checklist, remarks, decision } = req.body;

    if (!inquiry_id || !decision) {
      return res.status(400).json({ error: 'Inquiry ID and decision are required' });
    }

    const { data: review, error: reviewError } = await supabaseAdmin
      .from('qc_reviews')
      .insert([{
        inquiry_id,
        reviewer_id: req.user.id,
        checklist: checklist || {},
        remarks,
        status: decision
      }])
      .select()
      .single();

    if (reviewError) throw reviewError;

    const newStatus = decision === 'approved' ? 'technical_review' : 'sales_followup';

    const { data: inquiry } = await supabaseAdmin
      .from('inquiries')
      .select('status, created_at, updated_at')
      .eq('id', inquiry_id);

    const currentInquiry = getSingleRow(inquiry);
    if (!currentInquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    await transitionStage({
      inquiryId: inquiry_id,
      fromStatus: currentInquiry.status,
      toStatus: newStatus,
      transitionedBy: req.user.id,
      notes: remarks,
      fromStartedAtFallback: currentInquiry.updated_at || currentInquiry.created_at,
      details: { checklist: checklist || {}, feedback: remarks, decision }
    });

    if (req.io) {
      req.io.emit('project-status-updated', { projectId: inquiry_id, status: newStatus });
    }

    res.status(201).json(review);
  } catch (err) {
    console.error('QC submit error:', err);
    res.status(500).json({ error: 'Failed to submit QC review' });
  }
};

const getReviewHistory = async (req, res) => {
  try {
    const { inquiry_id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('qc_reviews')
      .select('*, users(name, email)')
      .eq('inquiry_id', inquiry_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch review history' });
  }
};

module.exports = { getPendingReviews, submitReview, getReviewHistory };
