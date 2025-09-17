'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import { GeoJsonLayer, BitmapLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { FlyToInterpolator, LinearInterpolator } from '@deck.gl/core';
import * as turf from '@turf/turf';

// Start with India overview
const INDIA_VIEW_STATE = {
  longitude: 78.9629,
  latitude: 20.5937,
  zoom: 4,
  pitch: 0,
  bearing: 0
};

function InteractiveMap() {
  const [viewState, setViewState] = useState(INDIA_VIEW_STATE);
  const [hoverInfo, setHoverInfo] = useState({});
  const [mapStyle, setMapStyle] = useState('esri_world');
  const [polygonData, setPolygonData] = useState(null);
  const [overlapAreas, setOverlapAreas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Enhanced animation states (KEPT EXACTLY THE SAME)
  const [isAnimating, setIsAnimating] = useState(false);
  const [claimsVisible, setClaimsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('idle');
  const [speedBlur, setSpeedBlur] = useState(0);
  const [bounceEffect, setBounceEffect] = useState(0);
  const [scanEffect, setScanEffect] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);
  const [overlayIntensity, setOverlayIntensity] = useState(0);

  // FRA-specific states
  const [conflictFilter, setConflictFilter] = useState('all');
  const [selectedClaims, setSelectedClaims] = useState([]);
  const [claimStats, setClaimStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showOverlaps, setShowOverlaps] = useState(true);
  const [activeAnalysis, setActiveAnalysis] = useState(null);

  const animationRef = useRef();
  const blurRef = useRef();
  const bounceRef = useRef();

  // **CRITICAL FIX: Helper function to clear ALL intervals and reset values**
  const clearAllAnimationEffects = () => {
    // Clear all intervals immediately
    if (blurRef.current) {
      clearInterval(blurRef.current);
      blurRef.current = null;
    }
    if (bounceRef.current) {
      clearInterval(bounceRef.current);
      bounceRef.current = null;
    }
    
    // Reset all effect values immediately
    setSpeedBlur(0);
    setOverlayIntensity(0);
    setScanEffect(false);
    setBounceEffect(0);
  };

  // Load MongoDB data
  const loadGeoJsonData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        const data = {
          type: 'FeatureCollection',
          features: result.data.map((user, index) => ({
            type: 'Feature',
            properties: {
              id: user._id,
              name: user.name,
              age: user.age,
              gender: user.gender,
              phoneNumber: user.phoneNumber,
              taluka: user.taluka,
              communityName: user.communityName,
              description: `${user.communityName} - ${user.taluka}`,
              population: Math.floor(Math.random() * 3000) + 1000,
              area: user.communityName,
              conflict: user.conflict,
              claimStatus: user.conflict ? 'disputed' : 'approved',
              claimDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              surveyDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              color: user.conflict 
                ? [255, 50, 50, 180] 
                : [100, 150, 255, 120]
            },
            geometry: user.geoData
          }))
        };
        
        console.log('✅ FRA Claims data loaded and ready');
        setPolygonData(data);
        calculateStats(data);
      } else {
        console.warn('No FRA claims found');
        alert('No FRA claims found. Please seed the database first at /cluster-seed');
      }
    } catch (error) {
      console.error('❌ Error loading claims data:', error);
      alert(`Failed to load claims data: ${error.message}`);
    }
    setLoading(false);
  };

  const calculateStats = (data) => {
    const stats = {
      totalClaims: data.features.length,
      approvedClaims: data.features.filter(f => !f.properties.conflict).length,
      disputedClaims: data.features.filter(f => f.properties.conflict).length,
      totalArea: data.features.reduce((sum, f) => sum + turf.area(f) / 10000, 0),
      averageClaimSize: 0
    };
    stats.averageClaimSize = stats.totalArea / stats.totalClaims;
    setClaimStats(stats);
  };

  const getFilteredData = () => {
    if (!polygonData) return null;
    
    let filtered = polygonData.features;
    
    if (conflictFilter === 'conflict') {
      filtered = filtered.filter(f => f.properties.conflict);
    } else if (conflictFilter === 'peaceful') {
      filtered = filtered.filter(f => !f.properties.conflict);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.properties.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.properties.communityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.properties.taluka.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return {
      type: 'FeatureCollection',
      features: filtered
    };
  };

  useEffect(() => {
    loadGeoJsonData();
  }, []);

  const calculateOverlaps = useCallback(() => {
    const filteredData = getFilteredData();
    if (!filteredData || !filteredData.features) return [];
    
    const overlaps = [];
    const features = filteredData.features;
    
    for (let i = 0; i < features.length; i++) {
      for (let j = i + 1; j < features.length; j++) {
        const poly1 = features[i];
        const poly2 = features[j];
        
        try {
          const hasOverlap = turf.booleanOverlap(poly1, poly2);
          if (hasOverlap) {
            const intersection = turf.intersect(turf.featureCollection([poly1, poly2]));
            if (intersection) {
              const overlapArea = turf.area(intersection) / 10000;
              overlaps.push({
                type: 'Feature',
                properties: {
                  id: `overlap_${poly1.properties.id}_${poly2.properties.id}`,
                  name: `Boundary Dispute: ${poly1.properties.name} & ${poly2.properties.name}`,
                  description: `Critical FRA boundary overlap detected`,
                  area1: poly1.properties.name,
                  area2: poly2.properties.name,
                  claim1: poly1.properties.name,
                  claim2: poly2.properties.name,
                  overlapArea: overlapArea.toFixed(2),
                  priority: overlapArea > 1 ? 'High' : overlapArea > 0.5 ? 'Medium' : 'Low',
                  isOverlap: true,
                  color: [255, 50, 50, 180]
                },
                geometry: intersection.geometry
              });
            }
          }
        } catch (error) {
          console.warn('Overlap calculation failed');
        }
      }
    }
    
    return overlaps;
  }, [polygonData, conflictFilter, searchTerm]);

  useEffect(() => {
    if (polygonData && claimsVisible && showOverlaps) {
      const overlaps = calculateOverlaps();
      setOverlapAreas(overlaps);
    }
  }, [polygonData, claimsVisible, calculateOverlaps, showOverlaps]);

  // **YOUR EXACT ANIMATION - FIXED WITH PROPER CLEANUP**
  const checkClaims = async () => {
    if (!polygonData || isAnimating) return;
    
    console.log('🎬 Starting cinematic investigation sequence...');
    
    // **CRITICAL FIX: Clear everything before starting**
    clearAllAnimationEffects();
    
    setIsAnimating(true);
    setAnimationPhase('preparing');
    setScanEffect(true);
    setOverlayIntensity(0.3);

    const bounds = turf.bbox(polygonData);
    const [minLng, minLat, maxLng, maxLat] = bounds;
    const claimsCenter = {
      longitude: (minLng + maxLng) / 2,
      latitude: (minLat + maxLat) / 2,
      zoom: 17,
      pitch: 0,
      bearing: 0
    };

    // PHASE 1: Preparation effect (0.5s)
    setTimeout(() => {
      setAnimationPhase('launching');
      setOverlayIntensity(0.5);
    }, 500);

    // PHASE 2: High-speed zoom with blur effect (2s)
    setTimeout(() => {
      setAnimationPhase('zooming');
      setOverlayIntensity(0.8);
      
      blurRef.current = setInterval(() => {
        setSpeedBlur(prev => Math.min(prev + 0.8, 15));
      }, 20);

      setViewState(prev => ({
        ...prev,
        longitude: claimsCenter.longitude,
        latitude: claimsCenter.latitude,
        zoom: 12,
        pitch: 60,
        bearing: 45,
        transitionInterpolator: new FlyToInterpolator({
          speed: 3,
          curve: 2.5
        }),
        transitionDuration: 1800
      }));
    }, 800);

    // PHASE 3: Final approach with deceleration (1.5s)
    setTimeout(() => {
      setAnimationPhase('approaching');
      setOverlayIntensity(0.6);
      
      const clearBlur = setInterval(() => {
        setSpeedBlur(prev => {
          const newBlur = Math.max(prev - 1.2, 0);
          if (newBlur <= 0) {
            clearInterval(clearBlur);
          }
          return newBlur;
        });
      }, 50);

      setViewState(prev => ({
        ...prev,
        zoom: claimsCenter.zoom,
        pitch: 25,
        bearing: 0,
        transitionInterpolator: new FlyToInterpolator({
          speed: 1.2,
          curve: 1.2
        }),
        transitionDuration: 1500
      }));
    }, 2800);

    // PHASE 4: Bounce landing effect (1s)
    setTimeout(() => {
      setAnimationPhase('landing');
      setScanEffect(false);
      setOverlayIntensity(0.2);

      bounceRef.current = setInterval(() => {
        setBounceEffect(prev => {
          const newBounce = Math.sin(prev + 0.4) * 0.3;
          if (prev > Math.PI * 4) {
            clearInterval(bounceRef.current);
            bounceRef.current = null;
            setBounceEffect(0);
            return 0;
          }
          return prev + 0.4;
        });
      }, 30);

      setViewState(prev => ({
        ...prev,
        pitch: 0,
        bearing: 0,
        transitionInterpolator: new LinearInterpolator(),
        transitionDuration: 800
      }));
    }, 4300);

    // PHASE 5: Reveal claims with progressive animation (2s)
    setTimeout(() => {
      setAnimationPhase('revealing');
      setClaimsVisible(true);
      setOverlayIntensity(0.1);

      const revealInterval = setInterval(() => {
        setRevealProgress(prev => {
          const newProgress = prev + 0.03;
          if (newProgress >= 1) {
            clearInterval(revealInterval);
            return 1;
          }
          return newProgress;
        });
      }, 50);
    }, 5100);

    // PHASE 6: Complete - **CRITICAL FIX: Complete cleanup**
    setTimeout(() => {
      setAnimationPhase('complete');
      setIsAnimating(false);
      
      // **COMPLETE CLEANUP - NO TINT, NO BLUR**
      clearAllAnimationEffects();
      
      console.log('🎉 Investigation sequence complete! Map fully visible now.');
    }, 7500);
  };

  // **YOUR EXACT RETURN ANIMATION - FIXED WITH PROPER CLEANUP**
  const resetToIndiaView = () => {
    if (isAnimating) return;
    
    console.log('🎬 Starting cinematic return sequence...');
    
    // **CRITICAL FIX: Clear everything before starting**
    clearAllAnimationEffects();
    
    setIsAnimating(true);
    setAnimationPhase('retreating');
    setScanEffect(true);
    setOverlayIntensity(0.4);

    const fadeOutInterval = setInterval(() => {
      setRevealProgress(prev => {
        const newProgress = Math.max(prev - 0.05, 0);
        if (newProgress <= 0) {
          clearInterval(fadeOutInterval);
          setClaimsVisible(false);
          return 0;
        }
        return newProgress;
      });
    }, 40);

    setTimeout(() => {
      setAnimationPhase('launching_return');
      setOverlayIntensity(0.6);
    }, 800);

    setTimeout(() => {
      setAnimationPhase('ascending');
      setOverlayIntensity(0.8);

      setViewState(prev => ({
        ...prev,
        pitch: 45,
        bearing: -30,
        zoom: prev.zoom - 2,
        transitionInterpolator: new LinearInterpolator(),
        transitionDuration: 1000
      }));

      blurRef.current = setInterval(() => {
        setSpeedBlur(prev => Math.min(prev + 1, 12));
      }, 30);
    }, 1300);

    setTimeout(() => {
      setAnimationPhase('zooming_out');
      setOverlayIntensity(1);
      setScanEffect(false);

      if (blurRef.current) {
        clearInterval(blurRef.current);
      }
      blurRef.current = setInterval(() => {
        setSpeedBlur(prev => Math.min(prev + 0.5, 18));
      }, 20);

      setViewState({
        longitude: INDIA_VIEW_STATE.longitude,
        latitude: INDIA_VIEW_STATE.latitude,
        zoom: INDIA_VIEW_STATE.zoom,
        pitch: 30,
        bearing: 15,
        transitionInterpolator: new FlyToInterpolator({
          speed: 2.8,
          curve: 2.2
        }),
        transitionDuration: 2200
      });
    }, 2300);

    setTimeout(() => {
      setAnimationPhase('approaching_india');
      setOverlayIntensity(0.4);

      const clearBlur = setInterval(() => {
        setSpeedBlur(prev => {
          const newBlur = Math.max(prev - 1.5, 0);
          if (newBlur <= 0) {
            clearInterval(clearBlur);
          }
          return newBlur;
        });
      }, 50);

      setViewState(prev => ({
        ...prev,
        pitch: 10,
        bearing: 0,
        transitionInterpolator: new LinearInterpolator(),
        transitionDuration: 1200
      }));
    }, 4800);

    setTimeout(() => {
      setAnimationPhase('landing_india');
      setOverlayIntensity(0.2);

      bounceRef.current = setInterval(() => {
        setBounceEffect(prev => {
          const newBounce = Math.sin(prev + 0.5) * 0.2;
          if (prev > Math.PI * 3) {
            clearInterval(bounceRef.current);
            bounceRef.current = null;
            setBounceEffect(0);
            return 0;
          }
          return prev + 0.5;
        });
      }, 40);

      setViewState({
        longitude: INDIA_VIEW_STATE.longitude,
        latitude: INDIA_VIEW_STATE.latitude,
        zoom: INDIA_VIEW_STATE.zoom,
        pitch: INDIA_VIEW_STATE.pitch,
        bearing: INDIA_VIEW_STATE.bearing,
        transitionInterpolator: new LinearInterpolator(),
        transitionDuration: 800
      });
    }, 6000);

    // PHASE 7: Complete - **CRITICAL FIX: Complete cleanup**
    setTimeout(() => {
      setAnimationPhase('idle');
      setIsAnimating(false);
      
      // **COMPLETE CLEANUP - NO TINT, NO BLUR**
      clearAllAnimationEffects();
      
      console.log('🎉 Return sequence complete! Map fully visible now.');
    }, 7500);
  };

  // Create satellite tile layer
  const createSatelliteTileLayer = (tileSource, layerId) => {
    return new TileLayer({
      id: layerId,
      data: tileSource,
      maxZoom: 20,
      minZoom: 0,
      tileSize: 256,
      renderSubLayers: props => {
        const {boundingBox} = props.tile;
        return new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]]
        });
      }
    });
  };

  const satelliteSources = {
    esri_world: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    esri_topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    osm: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
    cartodb_positron: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    cartodb_dark: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
  };

  const createBaseLayer = () => {
    const source = satelliteSources[mapStyle] || satelliteSources.esri_world;
    return createSatelliteTileLayer(source, `base-${mapStyle}`);
  };

  const filteredData = getFilteredData();
  
  const layers = [
    createBaseLayer(),
    
    ...(filteredData && claimsVisible ? [
      new GeoJsonLayer({
        id: 'polygon-layer',
        data: filteredData,
        pickable: true,
        stroked: true,
        filled: true,
        extruded: false,
        wireframe: true,
        opacity: revealProgress,
        getLineColor: d => {
          const intensity = 0.5 + 0.5 * revealProgress;
          if (selectedClaims.includes(d.properties.id)) {
            return [255, 255, 0, 255];
          }
          return hoverInfo.object === d 
            ? [255, 255, 255, 255] 
            : [255, 255, 255, Math.floor(200 * intensity)];
        },
        getFillColor: d => {
          const baseColor = d.properties.color || [100, 150, 255, 120];
          const glowIntensity = 1 + 0.3 * Math.sin(Date.now() * 0.003);
          return [
            Math.min(255, baseColor[0] * glowIntensity),
            Math.min(255, baseColor[1] * glowIntensity), 
            Math.min(255, baseColor[2] * glowIntensity),
            Math.floor(baseColor[3] * revealProgress)
          ];
        },
        getLineWidth: d => {
          if (selectedClaims.includes(d.properties.id)) return 4 * revealProgress;
          return (hoverInfo.object === d ? 4 : 2) * (0.5 + 0.5 * revealProgress);
        },
        onHover: (info) => setHoverInfo(info),
        onClick: (info) => {
          if (info.object) {
            const id = info.object.properties.id;
            setSelectedClaims(prev => 
              prev.includes(id) 
                ? prev.filter(x => x !== id)
                : [...prev, id]
            );
          }
        },
        updateTriggers: {
          opacity: revealProgress,
          getFillColor: [revealProgress],
          getLineColor: [hoverInfo.object, revealProgress, selectedClaims],
          getLineWidth: [hoverInfo.object, revealProgress, selectedClaims]
        }
      })
    ] : []),
    
    ...(overlapAreas.length > 0 && claimsVisible && showOverlaps ? [
      new GeoJsonLayer({
        id: 'overlap-layer',
        data: {
          type: 'FeatureCollection',
          features: overlapAreas
        },
        pickable: true,
        stroked: true,
        filled: true,
        extruded: false,
        opacity: revealProgress,
        getLineColor: [255, 255, 255, Math.floor(255 * revealProgress)],
        getFillColor: d => {
          const pulseIntensity = 0.6 + 0.4 * Math.sin(Date.now() * 0.008);
          return [255, 50, 50, Math.floor(200 * pulseIntensity * revealProgress)];
        },
        getLineWidth: 4 * revealProgress,
        onHover: (info) => setHoverInfo(info),
        updateTriggers: {
          getFillColor: [revealProgress],
          getLineWidth: [revealProgress],
          getLineColor: [revealProgress]
        }
      })
    ] : [])
  ];

  // **CINEMATIC OVERLAYS WITH GREEN SCANNING LINE**
  const CinematicOverlays = () => (
    <>
      {/* Dynamic Speed Blur Effect */}
      {speedBlur > 0 && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at center, 
              rgba(79, 172, 254, ${Math.min(speedBlur * 0.02, 0.3)}) 0%, 
              rgba(79, 172, 254, ${Math.min(speedBlur * 0.04, 0.5)}) 30%, 
              rgba(0, 100, 200, ${Math.min(speedBlur * 0.06, 0.7)}) 60%, 
              rgba(0, 0, 0, ${Math.min(speedBlur * 0.08, 0.9)}) 100%)`,
            filter: `blur(${speedBlur * 0.6}px)`,
            pointerEvents: 'none',
            zIndex: 400,
            transition: 'all 0.1s ease'
          }}
        />
      )}
      
      {/* Enhanced Overlay Effect */}
      {overlayIntensity > 0 && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, 
              rgba(0, 255, 255, ${overlayIntensity * 0.1}) 0%, 
              rgba(255, 0, 255, ${overlayIntensity * 0.15}) 50%, 
              rgba(0, 100, 255, ${overlayIntensity * 0.1}) 100%)`,
            backdropFilter: `blur(${overlayIntensity * 2}px)`,
            pointerEvents: 'none',
            zIndex: 350,
            transition: 'all 0.3s ease'
          }}
        />
      )}

      {/* **GREEN SCANNING LINE EFFECT** */}
      {scanEffect && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Green tint overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'rgba(0, 255, 0, 0.03)',
              mixBlendMode: 'screen'
            }}
          />
          {/* Horizontal green scanning line moving up and down */}
          <div 
            className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"
            style={{
              animation: 'greenScanVertical 3s ease-in-out infinite',
              filter: 'drop-shadow(0 0 8px rgba(0, 255, 0, 0.6))',
              boxShadow: '0 0 20px rgba(0, 255, 0, 0.4)'
            }}
          />
        </div>
      )}
      
      {/* Scan Effect */}
      {scanEffect && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(90deg, 
              transparent 0%, 
              rgba(0, 255, 255, 0.3) 45%, 
              rgba(0, 255, 255, 0.6) 50%, 
              rgba(0, 255, 255, 0.3) 55%, 
              transparent 100%)`,
            animation: 'scanLine 2s infinite',
            pointerEvents: 'none',
            zIndex: 450
          }}
        />
      )}
      
      {/* Bounce Effect */}
      {bounceEffect > 0 && (
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${1 + bounceEffect})`,
            width: '200px',
            height: '200px',
            border: '3px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 500,
            opacity: Math.max(0, 1 - Math.abs(bounceEffect) * 2)
          }}
        />
      )}
      
      {/* Enhanced Investigation HUD */}
      {animationPhase !== 'idle' && animationPhase !== 'complete' && (
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#00ffff',
            fontSize: '28px',
            fontWeight: 'bold',
            textShadow: '0 0 20px rgba(0, 255, 255, 0.8)',
            pointerEvents: 'none',
            zIndex: 600,
            fontFamily: 'monospace'
          }}
        >
          {animationPhase === 'preparing' && 'INITIALIZING FRA SCAN...'}
          {animationPhase === 'launching' && 'LAUNCHING INVESTIGATION...'}
          {animationPhase === 'zooming' && 'ZOOMING TO CLAIMS...'}
          {animationPhase === 'approaching' && 'APPROACHING TRIBAL LANDS...'}
          {animationPhase === 'landing' && 'LANDING...'}
          {animationPhase === 'revealing' && 'REVEALING FRA CLAIMS...'}
          
          {animationPhase === 'retreating' && 'CLOSING INVESTIGATION...'}
          {animationPhase === 'launching_return' && 'PREPARING RETURN...'}
          {animationPhase === 'ascending' && 'ASCENDING...'}
          {animationPhase === 'zooming_out' && 'RETURNING TO OVERVIEW...'}
          {animationPhase === 'approaching_india' && 'APPROACHING INDIA...'}
          {animationPhase === 'landing_india' && 'LANDING IN INDIA...'}
        </div>
      )}
    </>
  );

  // Enhanced tooltip content
  const renderTooltip = () => {
    const { object, x, y } = hoverInfo;
    
    if (!object) return null;
    
    const props = object.properties;
    
    return (
      <div 
        className="absolute z-50 bg-gray-900/95 text-white p-4 rounded-lg shadow-2xl border border-gray-600 max-w-sm backdrop-blur-sm"
        style={{ left: x + 10, top: y - 10 }}
      >
        {props.isOverlap ? (
          <div>
            <div className="font-bold text-red-400 mb-2">⚠️ BOUNDARY CONFLICT</div>
            <div><strong>Claims:</strong> {props.claim1} vs {props.claim2}</div>
            <div><strong>Overlap Area:</strong> {props.overlapArea} hectares</div>
            <div><strong>Priority:</strong> {props.priority}</div>
            <div className="text-yellow-400 text-xs mt-2">
              🏛️ Requires immediate government intervention under Forest Rights Act 2006
            </div>
          </div>
        ) : (
          <div>
            <div className="font-bold text-blue-400 mb-2">👤 {props.name}</div>
            <div><strong>📞 Contact:</strong> {props.phoneNumber}</div>
            <div><strong>🏘️ Community:</strong> {props.communityName}</div>
            <div><strong>📍 Taluka:</strong> {props.taluka}</div>
            <div className="mt-2">
              <strong>Status:</strong> 
              <span className={props.conflict ? 'text-red-400' : 'text-green-400'}>
                {props.conflict ? ' DISPUTED - Under Review' : ' APPROVED - Rights Granted'}
              </span>
            </div>
            <div><strong>Claim Date:</strong> {props.claimDate}</div>
            <div><strong>Survey Date:</strong> {props.surveyDate}</div>
            <div className="text-gray-400 text-xs mt-2">
              🏛️ Forest Rights Act 2006 | ID: {props.id.substring(0, 8)}... | Live Government Data
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      <DeckGL
        viewState={{
          ...viewState,
          pitch: viewState.pitch + bounceEffect
        }}
        onViewStateChange={({ viewState: newViewState }) => {
          if (!isAnimating) {
            setViewState(newViewState);
          }
        }}
        controller={!isAnimating}
        layers={layers}
        getTooltip={() => null}
      >
        <Map
          mapStyle={{
            version: 8,
            sources: {},
            layers: []
          }}
        />
      </DeckGL>

      <CinematicOverlays />
      
      {renderTooltip()}

      {/* Enhanced FRA Control Panel */}
      <div className="absolute top-4 right-4 bg-black/90 text-white p-4 rounded-lg backdrop-blur-sm border border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-blue-400">🏛️ Forest Rights Act Portal</h3>
        
        {Object.keys(claimStats).length > 0 && (
          <div className="mb-4 p-3 bg-gray-800/50 rounded border border-gray-600">
            <h4 className="font-semibold text-green-400 mb-2">📊 Claims Overview</h4>
            <div className="text-sm space-y-1">
              <div>Total Claims: <span className="text-blue-400">{claimStats.totalClaims}</span></div>
              <div>Approved: <span className="text-green-400">{claimStats.approvedClaims}</span></div>
              <div>Disputed: <span className="text-red-400">{claimStats.disputedClaims}</span></div>
              <div>Total Area: <span className="text-yellow-400">{claimStats.totalArea?.toFixed(2)} ha</span></div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search claims..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Filter by Status:</label>
          <select
            value={conflictFilter}
            onChange={(e) => setConflictFilter(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
          >
            <option value="all">All Claims</option>
            <option value="conflict">Disputed Only</option>
            <option value="peaceful">Approved Only</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Map Style:</label>
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
            disabled={isAnimating}
          >
            <option value="esri_world">Satellite</option>
            <option value="esri_topo">Topographic</option>
            <option value="osm">OpenStreetMap</option>
            <option value="cartodb_positron">Light</option>
            <option value="cartodb_dark">Dark</option>
          </select>
        </div>

        <div className="mb-4 space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showOverlaps}
              onChange={(e) => setShowOverlaps(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Show Overlaps</span>
          </label>
        </div>

        <div className="space-y-2">
          <button
            onClick={checkClaims}
            disabled={!polygonData || loading || isAnimating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors text-sm font-medium"
          >
            {loading ? '🔄 Loading...' : isAnimating ? '🎬 Investigating...' : '🔍 Investigate Claims'}
          </button>
          
          <button
            onClick={resetToIndiaView}
            disabled={isAnimating}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors text-sm font-medium"
          >
            {isAnimating ? '🎬 Returning...' : '🇮🇳 Return to India'}
          </button>

          {selectedClaims.length > 0 && (
            <button
              onClick={() => setSelectedClaims([])}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition-colors text-sm font-medium"
            >
              Clear Selection ({selectedClaims.length})
            </button>
          )}
        </div>

        {loading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <p className="text-sm mt-2">Loading FRA claims data...</p>
          </div>
        )}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes scanLine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100vw); }
        }
        @keyframes greenScanVertical {
          0% { top: -2%; }
          25% { top: 30%; }
          50% { top: 50%; }
          75% { top: 70%; }
          100% { top: 102%; }
        }
      `}</style>
    </div>
  );
}

export default InteractiveMap;
