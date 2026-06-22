import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export const AdminCouponsPage: React.FC = () => {
  const { t } = useTranslation();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number | ''>('');
  const [maxUses, setMaxUses] = useState<number | ''>('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        // If table doesn't exist yet, it will throw an error, we gracefully handle it
        console.error('Error fetching coupons:', error);
      } else {
        setCoupons(data || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const resetForm = () => {
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMaxUses('');
    setExpiresAt('');
    setIsActive(true);
    setEditingCoupon(null);
  };

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCode(coupon.code);
      setDiscountType(coupon.discount_type);
      setDiscountValue(coupon.discount_value);
      setMaxUses(coupon.max_uses || '');
      setExpiresAt(coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : '');
      setIsActive(coupon.is_active);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const payload = {
        code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        max_uses: maxUses === '' ? null : Number(maxUses),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: isActive,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(payload)
          .eq('id', editingCoupon.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert({
            ...payload,
            created_by: userData.user?.id
          });
        
        if (error) throw error;
      }

      handleCloseModal();
      fetchCoupons();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      alert('Error saving coupon: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      fetchCoupons();
    } catch (error: any) {
      alert('Error deleting coupon: ' + error.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Coupons Management</h1>
        <Button onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Create Coupon
        </Button>
      </div>

      <Card style={{ padding: '0', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Loading coupons...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Code</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Discount</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Uses</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Expires</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No coupons found. Create one to get started!
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--accent-primary)' }}>{coupon.code}</td>
                    <td style={{ padding: '16px' }}>
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `£${coupon.discount_value} OFF`}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {coupon.current_uses} {coupon.max_uses ? `/ ${coupon.max_uses}` : ''}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                      {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {coupon.is_active ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.875rem' }}>
                          <CheckCircle size={14} /> Active
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.875rem' }}>
                          <XCircle size={14} /> Inactive
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(coupon)} style={{ padding: '6px' }}>
                          <Edit2 size={14} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(coupon.id)} style={{ padding: '6px', color: '#ef4444', borderColor: '#ef4444' }}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <Card style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <XCircle size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>Coupon Code</label>
                <input 
                  type="text" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER50"
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>Discount Type</label>
                  <select 
                    value={discountType} 
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    style={inputStyle}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (£)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>Discount Value</label>
                  <input 
                    type="number" 
                    value={discountValue} 
                    onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 50"
                    required
                    min={0}
                    step={discountType === 'percentage' ? 1 : 0.01}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>Max Uses (Optional)</label>
                  <input 
                    type="number" 
                    value={maxUses} 
                    onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 100"
                    min={1}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>Expires At (Optional)</label>
                  <input 
                    type="date" 
                    value={expiresAt} 
                    onChange={(e) => setExpiresAt(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="isActive" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>Active / Valid</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit">Save Coupon</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.875rem'
};
