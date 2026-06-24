import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Edit3, Trash2, Plus, Star, Upload, Camera, Loader2, EyeOff, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    user_name: '',
    user_avatar: '',
    location_code: '',
    rating: 5,
    content: '',
    review_date: new Date().toISOString().split('T')[0],
    published: true
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    setReviews(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      if (editingReview) {
        const { error } = await supabase
          .from('reviews')
          .update(formData)
          .eq('id', editingReview.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reviews')
          .insert([formData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      setEditingReview(null);
      resetForm();
      fetchReviews();
    } catch (error) {
      console.error('Error saving review:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    fetchReviews();
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ published: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      fetchReviews();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('Failed to update publish status');
    }
  };

  const resetForm = () => {
    setFormData({
      user_name: '',
      user_avatar: '',
      location_code: '',
      rating: 5,
      content: '',
      review_date: new Date().toISOString().split('T')[0],
      published: true
    });
  };

  const openEdit = (review: any) => {
    setEditingReview(review);
    setFormData({
      user_name: review.user_name,
      user_avatar: review.user_avatar || '',
      location_code: review.location_code || '',
      rating: review.rating,
      content: review.content,
      review_date: review.review_date,
      published: review.published ?? true
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('reviews')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('reviews')
        .getPublicUrl(filePath);

      setFormData({ ...formData, user_avatar: data.publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image!');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>Verified Customers Review</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Manage social proof displayed on the homepage</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingReview(null); setIsModalOpen(true); }} style={{ gap: '8px' }}>
          <Plus size={18} /> Add Review
        </Button>
      </div>

      <Card style={{ padding: '0', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['User', 'Rating', 'Content', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading reviews...</td></tr>
              ) : reviews.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No reviews found. Add your first one!</td></tr>
              ) : reviews.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {r.user_avatar ? (
                        <img src={r.user_avatar} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: '#f59e0b' }}>
                          {r.user_name[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{r.user_name}</p>
                        <p style={{ fontSize: '0.6875rem', color: '#64748b' }}>{r.location_code}</p>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < r.rating ? "#22c55e" : "transparent"} color={i < r.rating ? "#22c55e" : "#475569"} />
                      ))}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, maxWidth: '300px' }}>
                    <p style={{ fontSize: '0.8125rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.content}</p>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: '#64748b', fontSize: '0.8125rem' }}>{new Date(r.review_date).toLocaleDateString()}</span>
                  </td>
                  <td style={tdStyle}>
                    {r.published !== false ? (
                      <span style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Published</span>
                    ) : (
                      <span style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Unpublished</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleTogglePublish(r.id, r.published !== false)} style={actionBtnStyle} title={r.published !== false ? "Unpublish Review" : "Publish Review"}>
                        {r.published !== false ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => openEdit(r)} style={actionBtnStyle} title="Edit Review"><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(r.id)} style={{ ...actionBtnStyle, color: '#ef4444' }} title="Delete Review"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div style={modalOverlayStyle} onClick={() => setIsModalOpen(false)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '24px', fontWeight: 800, fontSize: '1.25rem' }}>{editingReview ? 'Edit Review' : 'Add New Review'}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>User Name</label>
                <input style={inputStyle} value={formData.user_name} onChange={e => setFormData({...formData, user_name: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Location Code</label>
                  <input style={inputStyle} value={formData.location_code} onChange={e => setFormData({...formData, location_code: e.target.value})} placeholder="e.g. US, UK" />
                </div>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Rating (1-5)</label>
                  <select style={inputStyle} value={formData.rating} onChange={e => setFormData({...formData, rating: parseInt(e.target.value)})}>
                    {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} Stars</option>)}
                  </select>
                </div>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>User Avatar</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {formData.user_avatar ? (
                      <img src={formData.user_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                    ) : (
                      <Camera size={24} color="#64748b" />
                    )}
                    {uploading && (
                      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 className="animate-spin" size={20} color="#f59e0b" />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...actionBtnStyle, display: 'inline-flex', cursor: 'pointer', padding: '8px 16px', backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)' }}>
                      <Upload size={14} style={{ marginRight: '8px' }} />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                    </label>
                    <p style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '8px' }}>PNG, JPG or WebP (Max 2MB)</p>
                  </div>
                </div>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Review Content</label>
                <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Write the review here..." />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Review Date</label>
                <input type="date" style={inputStyle} value={formData.review_date} onChange={e => setFormData({...formData, review_date: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>Cancel</Button>
                <Button onClick={handleSave} style={{ flex: 1 }}>{editingReview ? 'Update' : 'Publish'} Review</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle: React.CSSProperties = { padding: '14px 20px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle: React.CSSProperties = { padding: '14px 20px', fontSize: '0.8125rem' };
const actionBtnStyle: React.CSSProperties = { padding: '6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' };
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
const modalContentStyle: React.CSSProperties = { maxWidth: '500px', width: '100%', padding: '32px', backgroundColor: '#0f172a', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' };
const inputGroupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 600, color: '#64748b' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '0.875rem', outline: 'none' };
