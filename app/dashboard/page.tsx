import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-lg">
          Welcome back, <span className="font-semibold">{session?.user?.name}</span>
        </p>
        <p className="text-gray-500 mt-1">
          Your email: {session?.user?.email}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="text-blue-800 font-medium">Total Items</h3>
          <p className="text-3xl font-bold text-blue-900 mt-2">--</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border border-green-100">
          <h3 className="text-green-800 font-medium">Monthly Spend</h3>
          <p className="text-3xl font-bold text-green-900 mt-2">$0.00</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
          <h3 className="text-purple-800 font-medium">Low Stock Alerts</h3>
          <p className="text-3xl font-bold text-purple-900 mt-2">0</p>
        </div>
      </div>
    </div>
  );
}