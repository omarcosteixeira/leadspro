const fs = require('fs');

let content = fs.readFileSync('temp_map2.txt', 'utf-8');

// The replacement DOM for the Map
const mapDOMReplacement = `{/* 2D RIO DE JANEIRO MAP MODE */}
              <div
                className="flex-1 relative overflow-hidden select-none bg-white flex items-center justify-center"
              >
                {/* Terrain controls top-right */}
                <div className="absolute top-4 right-4 z-10 flex flex-col space-y-1 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
                    title="Aproximar Zoom"
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <ZoomIn size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
                    title="Afastar Zoom"
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setZoom(1); setCenter([-42.5, -22.2]); }}
                    title="Redefinir Câmera"
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>

                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{
                    scale: 12000,
                  }}
                  className="w-full h-full"
                >
                  <ZoomableGroup
                    zoom={zoom}
                    center={center}
                    onMoveEnd={({ coordinates, zoom }) => {
                      setCenter(coordinates);
                      setZoom(zoom);
                    }}
                  >
                    {mapGeoUrl && (
                      <Geographies geography={mapGeoUrl}>
                        {({ geographies }) =>
                          geographies.map((geo) => (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill="#0ea5e9"
                              stroke="#ffffff"
                              strokeWidth={0.5}
                              style={{
                                default: { outline: "none" },
                                hover: { fill: "#0284c7", outline: "none" },
                                pressed: { fill: "#0369a1", outline: "none" },
                              }}
                            />
                          ))
                        }
                      </Geographies>
                    )}

                    {/* Markers */}
                    {empresasWithPositions.map((emp) => {
                      const isSelected = selectedEmpresa?.id === emp.id;
                      const status = emp.statusEmpresa || "Não visitada";
                      
                      let pinColor = "#94a3b8"; // Default slate
                      if (status === "Conveniada") pinColor = "#10b981"; // emerald
                      else if (status === "Em tratativa") pinColor = "#f59e0b"; // amber
                      else if (status === "Cancelada") pinColor = "#ef4444"; // red

                      return (
                        <Marker 
                          key={emp.id} 
                          coordinates={emp.pos}
                          onClick={() => {
                            onSelect(emp.id);
                            // Also center map on marker when selected
                            setCenter(emp.pos);
                            if (zoom < 2) setZoom(2);
                          }}
                        >
                          <g transform="translate(-12, -24)">
                            <path
                              d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"
                              fill={isSelected ? "#3b82f6" : pinColor}
                              stroke="#ffffff"
                              strokeWidth={1.5}
                              className="cursor-pointer drop-shadow-md transition-all duration-200"
                              style={{
                                transformOrigin: "bottom center",
                                transform: isSelected ? "scale(1.2)" : "scale(1)",
                              }}
                            />
                            <circle cx="12" cy="10" r="3" fill="#ffffff" className="pointer-events-none" />
                          </g>
                          {isSelected && (
                            <text
                              textAnchor="middle"
                              y={-30}
                              style={{
                                fontFamily: "Inter, sans-serif",
                                fill: "#1e293b",
                                fontSize: "10px",
                                fontWeight: "bold",
                                pointerEvents: "none",
                              }}
                              className="drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]"
                            >
                              {emp.nome}
                            </text>
                          )}
                        </Marker>
                      );
                    })}
                  </ZoomableGroup>
                </ComposableMap>
              </div>`;

// Replace everything between {/* 3D CITY PERSPECTIVE MODE */} and {/* Quick Details footer under the Map workspace */}
content = content.replace(/\{\/\* 3D CITY PERSPECTIVE MODE \*\/\}.*?(?=\{\/\* Quick Details footer under the Map workspace \*\/\})/s, mapDOMReplacement);


fs.writeFileSync('src/components/Mapa3D.tsx', content, 'utf-8');
