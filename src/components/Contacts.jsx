import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Contacts({ user }) {
  const [contacts, setContacts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: '',
    is_emergency: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          ...formData
        });

      if (error) throw error;

      setFormData({
        name: '',
        phone: '',
        email: '',
        relationship: '',
        is_emergency: false
      });
      setShowAddForm(false);
      fetchContacts();
    } catch (err) {
      console.error('Error adding contact:', err);
      setError('Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchContacts();
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError('Failed to delete contact');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold gradient-text">My Contacts</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary rounded-xl px-6 py-3 font-semibold flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Contact
        </button>
      </div>

      {error && (
        <div className="glass-error rounded-xl p-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-4">
        {contacts.map((contact) => (
          <div key={contact.id} className="glass-light rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-white font-medium flex items-center gap-2">
                  {contact.name}
                  {contact.is_emergency && (
                    <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
                      Emergency
                    </span>
                  )}
                </h3>
                <p className="text-slate-400 text-sm mt-1">{contact.phone}</p>
                {contact.email && (
                  <p className="text-slate-400 text-sm">{contact.email}</p>
                )}
                {contact.relationship && (
                  <p className="text-slate-400 text-sm">{contact.relationship}</p>
                )}
              </div>
              <button
                onClick={() => deleteContact(contact.id)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <div className="glass-light rounded-xl p-6 mt-6">
          <h3 className="text-xl font-bold text-white mb-4">Add New Contact</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 rounded-xl bg-gray-800/50 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="tel"
              placeholder="Phone Number (optional)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-3 rounded-xl bg-gray-800/50 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
            />
            <input
              type="email"
              placeholder={formData.is_emergency ? "Email *" : "Email (optional)"}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 rounded-xl bg-gray-800/50 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
              required={formData.is_emergency}
            />
            <input
              type="text"
              placeholder="Relationship (optional)"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              className="w-full p-3 rounded-xl bg-gray-800/50 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
            />
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={formData.is_emergency}
                onChange={(e) => setFormData({ ...formData, is_emergency: e.target.checked })}
                className="rounded"
              />
              Emergency Contact (requires email for alerts)
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 btn-secondary rounded-xl py-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary rounded-xl py-3"
              >
                {loading ? 'Adding...' : 'Add Contact'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
