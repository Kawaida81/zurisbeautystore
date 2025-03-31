export default function TopProducts() {
  const products = [
    { id: 1, name: "Hydrating Face Serum", sales: 156, amount: "$4,680", image: "/product1.jpg" },
    { id: 2, name: "Anti-Aging Night Cream", sales: 134, amount: "$4,020", image: "/product2.jpg" },
    { id: 3, name: "Vitamin C Brightening Mask", sales: 98, amount: "$2,940", image: "/product3.jpg" },
    { id: 4, name: "Ultra Moisture Body Lotion", sales: 87, amount: "$2,610", image: "/product4.jpg" },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Top Products</h2>
        <select className="border rounded-md py-1 px-3 text-sm">
          <option>This Month</option>
          <option>Last Month</option>
          <option>This Year</option>
        </select>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="pb-3 text-left font-medium text-gray-500">Product</th>
              <th className="pb-3 text-right font-medium text-gray-500">Sales</th>
              <th className="pb-3 text-right font-medium text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b">
                <td className="py-3 flex items-center">
                  <div className="h-10 w-10 bg-gray-100 rounded-md mr-3 flex-shrink-0"></div>
                  <span className="font-medium">{product.name}</span>
                </td>
                <td className="py-3 text-right">{product.sales}</td>
                <td className="py-3 text-right font-medium">{product.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 