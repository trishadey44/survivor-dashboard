import {
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  } from "recharts";
  
  export default function BarChartCard({ title, data, xKey, yKey }) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={yKey} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
  