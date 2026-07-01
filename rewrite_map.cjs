const fs = require('fs');

let content = fs.readFileSync('src/components/Mapa3D.tsx', 'utf-8');

// The new imports
const newImports = `import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import {
  MapPin,
  ExternalLink,
  Search,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "../lib/utils";`;

content = content.replace(/import React.*?import { cn } from "\.\.\/lib\/utils";/s, newImports);

// We need to replace the 3D map state
content = content.replace(/const \[rotation.*?setDragOffset\(\{ x: 0, y: 0 \}\);/s, `const [zoom, setZoom] = useState<number>(1);
  const [center, setCenter] = useState<[number, number]>([-42.5, -22.2]); // Approx center of RJ state
  const [mapGeoUrl, setMapGeoUrl] = useState<string>("");

  useEffect(() => {
    // Fetch RJ Municipalities GeoJSON from IBGE
    setMapGeoUrl("https://servicodados.ibge.gov.br/api/v3/malhas/estados/33?formato=application/vnd.geo+json&resolucao=5");
  }, []);`);

// Replace getCoordinates function entirely
const getCoordinatesReplacement = `const getCoordinates = (empresa: Empresa): [number, number] => {
    const { id, nome, endereco, bairro } = empresa;
    const combined = id + nome;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Normalize hash between 0 and 1 for X and Y
    const randX = Math.abs((hash * 17) % 1000) / 1000;
    const randY = Math.abs((hash * 31) % 1000) / 1000;

    const lowerBairro = (bairro || "").toLowerCase();
    const lowerAddress = (endereco || "").toLowerCase();
    
    const cidade = detectCidade(endereco);

    let minLng = -43.7, maxLng = -43.1;
    let minLat = -23.0, maxLat = -22.8;

    if (cidade === "Rio de Janeiro") {
        const zonaSul = ["copacabana", "ipanema", "leblon", "botafogo", "flamengo", "gávea", "catete", "laranjeiras", "glória", "urca", "jardim botânico", "humaitá", "leme", "lagoa", "cosme velho", "são conrado"];
        const centro = ["centro", "lapa", "santa teresa", "estácio", "rio comprido", "gamboa", "saúde", "santo cristo", "maravilha", "castelo", "cinelândia", "praça xv", "catumbi"];
        const zonaOeste = ["barra", "recreio", "jacarepaguá", "campo grande", "santa cruz", "bangu", "realengo", "taquara", "anil", "freguesia", "curicica", "camorim", "itanhangá", "vargem", "cosmos", "paciência", "guaratiba", "pechincha", "sulacap", "padre miguel", "senador camará"];
        const zonaNorte = ["tijuca", "vila isabel", "grajaú", "maracanã", "méier", "madureira", "penha", "bonsucesso", "ilha do governador", "ramos", "iraja", "irajá", "cascadura", "meier", "del castilho", "galeão", "inhaúma", "pavuna", "vaz lobo", "benfica", "sampaio", "engenho", "piedade", "quintino", "anchieta", "coelho neto", "colégio", "cordovil", "higienópolis", "jacaré", "manguinhos", "olaria", "rocha", "vargas", "vicente de carvalho", "vigário geral", "vista alegre"];

        const matchesRegion = (list) => {
            return list.some(item => lowerBairro.includes(item) || lowerAddress.includes(item));
        };

        if (matchesRegion(zonaSul)) {
            minLng = -43.25; maxLng = -43.15;
            minLat = -22.99; maxLat = -22.95;
        } else if (matchesRegion(centro)) {
            minLng = -43.20; maxLng = -43.15;
            minLat = -22.93; maxLat = -22.88;
        } else if (matchesRegion(zonaOeste)) {
            minLng = -43.70; maxLng = -43.35;
            minLat = -23.05; maxLat = -22.85;
        } else if (matchesRegion(zonaNorte)) {
            minLng = -43.35; maxLng = -43.20;
            minLat = -22.88; maxLat = -22.80;
        } else {
            minLng = -43.70; maxLng = -43.15;
            minLat = -23.05; maxLat = -22.80;
        }
    } else if (cidade === "Niterói" || cidade === "São Gonçalo" || cidade === "Itaboraí" || cidade === "Maricá") {
        minLng = -43.1; maxLng = -42.8;
        minLat = -22.95; maxLat = -22.7;
    } else if (cidade === "Duque de Caxias" || cidade === "Nova Iguaçu" || cidade === "Belford Roxo" || cidade === "São João de Meriti" || cidade === "Nilópolis" || cidade === "Mesquita" || cidade === "Queimados") {
        minLng = -43.5; maxLng = -43.2;
        minLat = -22.8; maxLat = -22.6;
    } else if (cidade === "Petrópolis" || cidade === "Teresópolis") {
        minLng = -43.2; maxLng = -42.9;
        minLat = -22.5; maxLat = -22.3;
    } else if (cidade === "Cabo Frio" || cidade === "Araruama" || cidade === "Saquarema" || cidade === "Rio das Ostras" || cidade === "Macaé") {
        minLng = -42.3; maxLng = -41.7;
        minLat = -22.9; maxLat = -22.3;
    } else if (cidade === "Campos dos Goytacazes") {
        minLng = -41.5; maxLng = -41.1;
        minLat = -21.9; maxLat = -21.5;
    } else if (cidade === "Volta Redonda" || cidade === "Resende" || cidade === "Angra dos Reis") {
        minLng = -44.5; maxLng = -43.9;
        minLat = -22.6; maxLat = -22.3;
    }

    const lng = minLng + (randX * (maxLng - minLng));
    const lat = minLat + (randY * (maxLat - minLat));

    return [lng, lat];
  };`;

content = content.replace(/const getCoordinates = \(empresa: Empresa\) => \{.*?\n  \};/s, getCoordinatesReplacement);

// Replace mapping filteredEmpresas to pos: {x, y} with pos: [lng, lat]
content = content.replace(/const { x, y } = getCoordinates\(emp\);\s*return \{\s*\.\.\.emp,\s*pos: \{ x, y \},\s*\};/s, `const coords = getCoordinates(emp);\n      return {\n        ...emp,\n        pos: coords,\n      };`);

// Remove handleResetCamera and drag handling
content = content.replace(/\/\/ Reset 3D camera.*?\/\/ Map drag handling.*?const handleMouseMove = \(e: React\.MouseEvent\) => \{.*?setDragStart\(\{ x: e\.clientX, y: e\.clientY \}\);\n  \};/s, '');

// Save temp file to see where we are
fs.writeFileSync('temp_map2.txt', content, 'utf-8');
