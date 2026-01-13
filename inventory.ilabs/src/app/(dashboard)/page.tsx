export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          Welcome to the iLabs Office Inventory System.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Simple Metric Cards */}
        {["Total Stock", "Active Vendors", "Pending Bills", "Monthly Spend"].map((title) => (
          <div key={title} className="p-6 bg-white border rounded-xl shadow-sm">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">--</p>
          </div>
        ))}
      </div>
    </div>
  );
}