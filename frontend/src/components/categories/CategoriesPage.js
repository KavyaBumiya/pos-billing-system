import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState({ name: '', description: '' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => getCategories().then(r => setCategories(r.data)).catch(() => toast.error('Failed to load categories'));

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ name: '', description: '' }); setEditId(null); setModal('form'); };
  const openEdit = (cat) => { setForm({ name: cat.name, description: cat.description || '' }); setEditId(cat.id); setModal('form'); };
  const closeModal = () => setModal(null);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Category name is required'); return; }
    setLoading(true);
    try {
      if (editId) {
        await updateCategory(editId, form);
        toast.success('Category updated');
      } else {
        await createCategory(form);
        toast.success('Category created');
      }
      closeModal();
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await deleteCategory(cat.id);
      toast.success('Category deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Cannot delete');
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Categories</h1>
        <button className="btn btn-primary" onClick={openAdd}><Plus />Add Category</button>
      </div>
      <div className="page-body">
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>No categories yet</td></tr>
                )}
                {categories.map((cat, i) => (
                  <tr key={cat.id}>
                    <td>{i + 1}</td>
                    <td><strong>{cat.name}</strong></td>
                    <td style={{ color: 'var(--gray-500)' }}>{cat.description || '—'}</td>
                    <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{cat.created_at?.slice(0, 10)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(cat)}><Pencil />Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cat)}><Trash2 />Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal === 'form' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Edit Category' : 'Add Category'}</span>
              <button className="btn btn-secondary btn-sm" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Milk, Paneer..." autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-control" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
