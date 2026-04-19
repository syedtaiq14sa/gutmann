const { supabaseAdmin } = require('../config/supabase');

class SupabaseService {
  async getAll(table, filters = {}, options = {}) {
    let query = supabaseAdmin.from(table).select(options.select || '*');

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending !== false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getById(table, id, select = '*') {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(select)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(table, payload) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(table, id, payload) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(table, id) {
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}

module.exports = new SupabaseService();
