import { prisma } from '@/app/lib/prisma';
import { formatINR, paiseToRupees } from '@/app/lib/currency';
import UserActions from './UserActions';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });

  // Fetch recent orders (up to 5) for each user by matching email
  const ordersByEmail = await Promise.all(
    users.map((u) =>
      prisma.order.findMany({
        where: { email: u.email },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, totalPrice: true, status: true, createdAt: true }
      })
    )
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin: Users</h1>
      <p className="text-gray-700">View registered users, their recent orders, and manage account status.</p>

      <div className="overflow-x-auto bg-white border rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Orders</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u, idx) => {
              const recent = ordersByEmail[idx];
              return (
                <tr key={u.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{u.name}</div>
                    <div className="text-xs text-gray-500">ID: {u.id.slice(-8)}</div>
                    <div className="text-xs text-gray-500">Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{u.email}</div>
                    <div className="text-sm text-gray-900">{u.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${u.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{u.isVerified ? 'Verified' : 'Unverified'}</span>
                      <span className={`text-xs px-2 py-1 rounded ${u.isOnHold ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{u.isOnHold ? 'On Hold' : 'Active'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {recent && recent.length > 0 ? (
                      <ul className="space-y-1 text-sm">
                        {recent.map((o) => (
                          <li key={o.id} className="flex items-center justify-between">
                            <a href={`/admin/orders/${o.id}`} className="text-blue-600 hover:text-blue-800">#{o.id.slice(-8)}</a>
                            <span className="text-gray-600">{formatINR(paiseToRupees(o.totalPrice))}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${o.status === 'PAID' ? 'bg-green-100 text-green-700' : o.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : o.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{o.status}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-gray-500">No recent orders</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <UserActions id={u.id} isOnHold={u.isOnHold} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}