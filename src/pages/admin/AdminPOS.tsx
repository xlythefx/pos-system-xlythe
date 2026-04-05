import AdminLayout from '@/components/admin/AdminLayout';
import POSMenuGrid from '@/components/admin/POSMenuGrid';
import POSCart from '@/components/admin/POSCart';

const AdminPOS = () => {
  return (
    <AdminLayout>
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Menu Section - only this scrolls */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <POSMenuGrid />
        </div>
        
        {/* Cart Section - fixed right sidebar, CHARGE always visible */}
        <div className="lg:w-96 h-80 lg:h-full lg:min-h-0 shrink-0 flex flex-col">
          <POSCart />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPOS;
