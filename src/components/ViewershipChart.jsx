import {
    LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  } from "recharts";
  
  export default function ViewershipChart({ seasons }) {
    const data = seasons
      .map(s => ({
        season: s.season_number,
        viewers: s.viewership_millions ?? null,
        title: s.title,
      }))
      .filter(d => d.viewers !== null);
  
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Average Viewership by Season (Millions)</h3>
        <div className="small" style={{ marginBottom: 8 }}>
          Hover the line to see values
        </div>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="season" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="viewers" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
  