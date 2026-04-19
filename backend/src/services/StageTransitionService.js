const { supabaseAdmin } = require('../config/supabase');

const getDiffMs = (start, end) => Math.max(0, new Date(end).getTime() - new Date(start).getTime());
const toHours = (start, end) => Math.round(getDiffMs(start, end) / (1000 * 60 * 60));
const toDays = (start, end) => Math.round(getDiffMs(start, end) / (1000 * 60 * 60 * 24));

const initializeStage = async ({ inquiryId, stage = 'received', assignedTo = null, overrideStartedAt }) => {
  const now = overrideStartedAt || new Date().toISOString();
  await supabaseAdmin
    .from('project_status')
    .insert([{
      inquiry_id: inquiryId,
      stage,
      assigned_to: assignedTo,
      started_at: now
    }]);
};

const finalizeStage = async ({ inquiryId, stage, completedAt, fallbackStartedAt }) => {
  const { data: openRows } = await supabaseAdmin
    .from('project_status')
    .select('*')
    .eq('inquiry_id', inquiryId)
    .eq('stage', stage)
    .is('completed_at', null)
    .order('started_at', { ascending: false })
    .limit(1);

  const openStage = openRows?.[0];

  if (openStage) {
    const startedAt = openStage.started_at || completedAt;
    await supabaseAdmin
      .from('project_status')
      .update({
        completed_at: completedAt,
        duration_hours: toHours(startedAt, completedAt),
        bottleneck_days: toDays(startedAt, completedAt)
      })
      .eq('id', openStage.id);
    return;
  }

  if (fallbackStartedAt) {
    await supabaseAdmin.from('project_status').insert([{
      inquiry_id: inquiryId,
      stage,
      started_at: fallbackStartedAt,
      completed_at: completedAt,
      duration_hours: toHours(fallbackStartedAt, completedAt),
      bottleneck_days: toDays(fallbackStartedAt, completedAt)
    }]);
    return;
  }

  console.warn(`[StageTransitionService] No open stage row found for inquiry ${inquiryId} stage ${stage}`);
};

const transitionStage = async ({
  inquiryId,
  fromStatus,
  toStatus,
  transitionedBy,
  notes = null,
  details = {},
  fromStartedAtFallback = null
}) => {
  const now = new Date().toISOString();

  await finalizeStage({
    inquiryId,
    stage: fromStatus,
    completedAt: now,
    fallbackStartedAt: fromStartedAtFallback
  });

  await initializeStage({ inquiryId, stage: toStatus, overrideStartedAt: now });

  const { data: inquiry, error: updateError } = await supabaseAdmin
    .from('inquiries')
    .update({ status: toStatus, updated_at: now })
    .eq('id', inquiryId)
    .select()
    .single();

  if (updateError) throw updateError;

  await supabaseAdmin.from('workflow_transitions').insert([{
    inquiry_id: inquiryId,
    from_status: fromStatus,
    to_status: toStatus,
    transitioned_by: transitionedBy,
    notes
  }]);

  await supabaseAdmin.from('audit_log').insert([{
    action: 'stage_changed',
    entity_type: 'inquiry',
    entity_id: inquiryId,
    performed_by: transitionedBy,
    details: {
      from: fromStatus,
      to: toStatus,
      notes,
      started_at: now,
      transitioned_at: now,
      ...details
    }
  }]);

  return inquiry;
};

module.exports = {
  initializeStage,
  transitionStage,
  toHours
};
