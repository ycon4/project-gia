import { MessageCircle, BarChart3, Home } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-gray-800">
          Welcome to GIA
        </h1>
        <p className="text-2xl text-gray-700">
          Gender and Development Center Information Assistant
        </p>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your intelligent assistant for accessing and analyzing sex-disaggregated data at MSU-IIT
        </p>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-100 mt-12">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">About GADC of MSU-IIT</h2>
        <div className="text-gray-700 space-y-4">
          <p className="text-lg leading-relaxed">
            The Gender and Development Center (GADC) at Mindanao State University – Iligan Institute of Technology (MSU-IIT) was established to promote gender equality within the institution and its surrounding communities.
          </p>
          <p className="text-lg leading-relaxed">
            Guided by Republic Act 7192 and national agencies, the GADC is tasked with integrating sex-disaggregated considerations into instruction, research, extension, and production activities.
          </p>
          <p className="text-lg leading-relaxed">
            The Center serves as a hub for monitoring, evaluating, and reporting on institutional gender initiatives, ensuring compliance with national policies and contributing to more inclusive governance and academic planning.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <div className="bg-white rounded-xl p-6 shadow-md border border-purple-100 hover:shadow-lg transition">
          <Home className="text-purple-600 mb-4" size={32} />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">About GADC</h3>
          <p className="text-gray-600">Learn about our mission, vision, and initiatives at MSU-IIT</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border border-purple-100 hover:shadow-lg transition">
          <BarChart3 className="text-purple-600 mb-4" size={32} />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Data Analytics</h3>
          <p className="text-gray-600">Access comprehensive sex-disaggregated data and insights</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border border-purple-100 hover:shadow-lg transition">
          <MessageCircle className="text-purple-600 mb-4" size={32} />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">AI Assistant</h3>
          <p className="text-gray-600">Chat with GIA for instant data queries and analysis</p>
        </div>
      </div>
    </div>
  );
}