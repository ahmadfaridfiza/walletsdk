export default function HotelDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-4">
        <h2 className="text-xl font-semibold text-center mb-4">Hotel Menu</h2>
        <ul className="space-y-2 text-sm">
          {[
            "Dashboard",
            "Room Type Master",
            "Room Management",
            "Reservation",
            "Staff Management",
            "Restaurant",
            "Customers",
            "Reports",
            "Complaint",
            "Invoice",
            "Laundry",
            "Expenses",
            "Payments",
            "Hotel Profile",
            "Content Management",
            "Service Providers",
            "Contact Query",
          ].map((item, idx) => (
            <li
              key={idx}
              className="px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 hover:text-blue-600"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Topbar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-lg font-semibold">
            Welcome to Hotel Luxury Hotel
          </h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-500 text-white p-6 rounded-xl text-center">
            <p className="text-2xl font-bold">7</p>
            <p>Total Rooms</p>
          </div>
          <div className="bg-blue-500 text-white p-6 rounded-xl text-center">
            <p className="text-2xl font-bold">18</p>
            <p>Total Customers</p>
          </div>
          <div className="bg-purple-600 text-white p-6 rounded-xl text-center">
            <p className="text-2xl font-bold">16</p>
            <p>Total Food Items</p>
          </div>
          <div className="bg-purple-600 text-white p-6 rounded-xl text-center">
            <p className="text-2xl font-bold">1</p>
            <p>Total Reservations</p>
          </div>
        </div>

        {/* Rooms */}
        <h2 className="text-lg font-semibold mb-4">Rooms (7)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="bg-red-200 p-6 rounded-xl text-center">
            <p className="font-semibold">Luxury</p>
            <p className="text-xl font-bold">101</p>
          </div>
          <div className="bg-white border p-6 rounded-xl text-center">
            <p className="font-semibold">Luxury (AC)</p>
            <p className="text-xl font-bold">201</p>
          </div>
          <div className="bg-white border p-6 rounded-xl text-center">
            <p className="font-semibold">Luxury (AC)</p>
            <p className="text-xl font-bold">701</p>
          </div>
          <div className="bg-white border p-6 rounded-xl text-center">
            <p className="font-semibold">Luxury (AC)</p>
            <p className="text-xl font-bold">301</p>
          </div>
          <div className="bg-white border p-6 rounded-xl text-center">
            <p className="font-semibold">Non-Luxury (Non-AC)</p>
            <p className="text-xl font-bold">401</p>
          </div>
          <div className="bg-white border p-6 rounded-xl text-center">
            <p className="font-semibold">Luxury (AC)</p>
            <p className="text-xl font-bold">545</p>
          </div>
          <div className="bg-white border p-6 rounded-xl text-center">
            <p className="font-semibold">Default</p>
            <p className="text-xl font-bold">10199</p>
          </div>
        </div>
      </div>
    </div>
  );
}
