import { BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-bold text-gray-800 mb-8">Dashboard</h1>
      <div className="bg-white rounded-2xl p-12 shadow-lg border border-purple-100 text-center">
        <BarChart3 className="mx-auto text-purple-600 mb-4" size={64} />
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Data Visualizations Coming Soon</h2>
        <p className="text-gray-600 text-lg">
          Tables and graphs for MSU-IIT student and employee information will be displayed here.
        </p>
      </div>
    </div>
  );
}