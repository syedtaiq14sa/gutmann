const { supabaseAdmin } = require('../config/supabase');

class NotificationService {
  async sendNotification(userId, title, message, type = 'info', relatedId = null) {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert([{
          user_id: userId,
          title,
          message,
          type,
          related_id: relatedId,
          read: false
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  }

  async notifyRoleUsers(role, title, message, type = 'info', relatedId = null) {
    try {
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', role)
        .eq('is_active', true);

      if (error || !users) return;

      const notifications = users.map(user => ({
        user_id: user.id,
        title,
        message,
        type,
        related_id: relatedId,
        read: false
      }));

      await supabaseAdmin.from('notifications').insert(notifications);
    } catch (err) {
      console.error('Failed to notify role users:', err);
    }
  }

  async notifyWorkflowTransition(projectId, fromStatus, toStatus, io = null) {
    const roleMap = {
      qc_review: 'qc',
      technical_review: 'technical',
      estimation: 'estimation',
      ceo_approval: 'ceo',
      client_review: 'salesperson'
    };

    const targetRole = roleMap[toStatus];
    if (targetRole) {
      await this.notifyRoleUsers(
        targetRole,
        'New Project Assignment',
        `A project has been moved to ${toStatus.replace('_', ' ')} stage`,
        'task',
        projectId
      );
    }

    if (io) {
      io.emit('notification', { projectId, fromStatus, toStatus });
    }
  }
}

module.exports = new NotificationService();
