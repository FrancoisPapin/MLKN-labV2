// MLKN.lab — Interdisciplinary Network Renderer
// 26 Disciplines + 5 Core Layers + 4 Meta-Layers
// Major bridges (weight≥4): thick solid blended-colour lines
// Minor bridges (weight 2–3): thin dashed lines
// Progressive disclosure: Click nodes to expand layers
// Author: François Papin | May 2026 | MIT License
// https://www.linkedin.com/in/francoispapin/ | https://github.com/FrancoisPapin
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  if (!window.MLKN) { console.error('mlkn.js not loaded'); return; }
  MLKN.renderNav(false);
  MLKN.renderFooterWatermark('map-footer');

  var data = window.MAP_DATA;
  if (!data) {
    document.getElementById('loading').innerHTML =
      '<p style="color:#C0392B;font-family:monospace">interdisciplinary-data.js failed to load.</p>';
    return;
  }

  // ── Accent bar gradient (all discipline colours) ────────────────────────────
  var discColors = Object.values(data.disciplines).map(function (d) { return d.color; });
  document.getElementById('abar').style.background =
    'linear-gradient(180deg,' + discColors.join(',') + ')';

  // Update stats to reflect new structure
  var totalBridges = data.interLinks ? data.interLinks.length : 0;
  var totalNodes = data.nodes.length;
  var totalDisciplines = data.metadata ? data.metadata.totalDisciplines : 26;
  document.getElementById('mh-stats').textContent =
    totalNodes + ' concepts · ' + totalBridges + ' bridges · ' + totalDisciplines + ' disciplines';

  // ── Colour helper ─────────────────────────────────────────────
  function blendHex(c1, c2) {
    var p = function (c) { return parseInt(c.slice(1), 16); };
    var r1=(p(c1)>>16)&255, g1=(p(c1)>>8)&255, b1=p(c1)&255;
    var r2=(p(c2)>>16)&255, g2=(p(c2)>>8)&255, b2=p(c2)&255;
    var r=Math.round((r1+r2)/2), g=Math.round((g1+g2)/2), b=Math.round((b1+b2)/2);
    return '#'+[r,g,b].map(function(x){return x.toString(16).padStart(2,'0');}).join('');
  }

  // ── State ─────────────────────────────────────────────────────
  var activeLayer  = 'disc';   // 'disc' | 'epist' | 'level' | 'layer'
  var bridgesOnly  = false;
  var activeFilter = null;     // cluster/role/level/layer key
  var hubsOn       = false;
  var statsVisible = true;
  var graph        = null;

  // Node colour per layer
  function nodeColor(d) {
    if (activeLayer === 'epist' && d.epistemicRole) {
      return (data.epistemic[d.epistemicRole] || { color: '#999' }).color;
    }
    if (activeLayer === 'level' && d.analysisLevel) {
      return (data.analysisLevels[d.analysisLevel] || { color: '#999' }).color;
    }
    if (activeLayer === 'layer' && d.layer) {
      // Color by layer
      const layerColors = {
        1: '#808080', // Core Domains
        2: '#4A90E2', // Disciplines
        3: '#50C878', // Subdisciplines
        4: '#FFD700', // Thematic Domains
        5: '#E0FFFF'  // Main Thematics
      };
      return layerColors[d.layer] || '#999';
    }
    return (data.disciplines[d.disc] || { color: '#999' }).color;
  }

  function nodeLight(d) {
    if (activeLayer === 'epist' && d.epistemicRole) {
      var c = (data.epistemic[d.epistemicRole] || { color: '#999' }).color;
      return c + '22';
    }
    if (activeLayer === 'level' && d.analysisLevel) {
      var c2 = (data.analysisLevels[d.analysisLevel] || { color: '#999' }).color;
      return c2 + '22';
    }
    if (activeLayer === 'layer' && d.layer) {
      // Light color by layer
      const layerLightColors = {
        1: '#80808022', // Core Domains
        2: '#4A90E222', // Disciplines
        3: '#50C87822', // Subdisciplines
        4: '#FFD70022', // Thematic Domains
        5: '#E0FFFF22'  // Main Thematics
      };
      return layerLightColors[d.layer] || '#99999922';
    }
    return (data.disciplines[d.disc] || { color: '#eee', light: '#eee' }).light;
  }

  // ── Build D3 graph ────────────────────────────────────────────
  var mount = document.getElementById('sigma-mount');
  var W = mount.clientWidth, H = mount.clientHeight;

  var svg = d3.select(mount).append('svg')
    .attr('width', W).attr('height', H)
    .attr('role', 'img')
    .attr('aria-label', 'Interdisciplinary knowledge network graph')
    .style('position', 'absolute').style('inset', '0').style('display', 'block');

  var defs = svg.append('defs');
  // Background gradient
  var rg = defs.append('radialGradient').attr('id', 'bg-id').attr('cx', '50%').attr('cy', '50%').attr('r', '60%');
  rg.append('stop').attr('offset', '0%').attr('stop-color', '#fff').attr('stop-opacity', '.4');
  rg.append('stop').attr('offset', '100%').attr('stop-color', '#fff').attr('stop-opacity', '0');

  // Glow filters per discipline
  Object.keys(data.disciplines).forEach(function (k) {
    var f = defs.append('filter').attr('id', 'gid-' + k)
      .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    f.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'b');
    var m = f.append('feMerge');
    m.append('feMergeNode').attr('in', 'b');
    m.append('feMergeNode').attr('in', 'SourceGraphic');
  });

  // Layer-specific glow filters
  const layerGlowFilters = {
    1: 'layer1-glow',
    2: 'layer2-glow',
    3: 'layer3-glow',
    4: 'layer4-glow',
    5: 'layer5-glow'
  };

  Object.keys(layerGlowFilters).forEach(layer => {
    var f = defs.append('filter').attr('id', layerGlowFilters[layer])
      .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    f.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'b');
    var m = f.append('feMerge');
    m.append('feMergeNode').attr('in', 'b');
    m.append('feMergeNode').attr('in', 'SourceGraphic');
  });

  svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#FAFAF8');
  svg.append('rect').attr('width', W).attr('height', H)
    .attr('fill', 'url(#bg-id)').attr('pointer-events', 'none');

  var g = svg.append('g');
  var zoom = d3.zoom().scaleExtent([0.08, 5])
    .on('zoom', function (e) { g.attr('transform', e.transform); });
  svg.call(zoom).on('dblclick.zoom', null);

  // Clone nodes/links with visibility
  var simNodes = data.nodes.map(function (d) {
    return Object.assign({}, d, {
      visible: d.visible !== undefined ? d.visible : (d.layer <= 2)
    });
  });

  var intraRaw = data.intraLinks || [];
  var interRaw = data.interLinks || [];
  var simLinks = intraRaw.map(function (l) {
    return {
      source: l.source || l.s,
      target: l.target || l.t,
      weight: l.weight || l.w || 1,
      inter: false,
      visible: true
    };
  }).concat(interRaw.map(function (l) {
    return {
      source: l.source || l.s,
      target: l.target || l.t,
      weight: l.weight || l.w || 1,
      inter: true,
      pair: l.pair,
      visible: true
    };
  }));

  // Define coreDomains from MAP_DATA if not already defined
  var coreDomains = data.coreDomains || {
    FORMAL: { label: "Formal Sciences", color: "#FF6347" },
    NATURAL: { label: "Natural Sciences", color: "#2ECC71" },
    HEALTH: { label: "Health Sciences", color: "#3498DB" },
    SOCIAL: { label: "Social Sciences", color: "#9B59B6" },
    HUMANITIES: { label: "Humanities", color: "#E74C3C" },
    APPLIED: { label: "Applied Sciences", color: "#F39C12" }
  };

  // Discipline cluster centres in a circle
  var cx = W / 2, cy = H / 2;
  var R = Math.min(W, H) * 0.30;
  var dKeys = Object.keys(data.disciplines), dc = {};
  dKeys.forEach(function (k, i) {
    var a = (i / dKeys.length) * 2 * Math.PI - Math.PI / 2;
    dc[k] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });

  // Force simulation with layer-based forces
  var sim = d3.forceSimulation(simNodes)
    .force('link', d3.forceLink(simLinks).id(function(d) {
      if (typeof d === 'string') return d;
      if (d && d.id) return d.id;
      return d;
    }).distance(function(d) {
      const getLayer = (node) => {
        if (typeof node === 'object' && node.layer) return node.layer;
        if (typeof node === 'string') {
          const foundNode = simNodes.find(n => n.id === node);
          return foundNode ? foundNode.layer : 2;
        }
        return 2;
      };

      const sourceLayer = getLayer(d.source);
      const targetLayer = getLayer(d.target);
      const layerDiff = Math.abs(sourceLayer - targetLayer);

      const baseDistance = d.inter
        ? 200 + (5 - (d.weight || 1)) * 25
        : 70 + (5 - (d.weight || 1)) * 8;

      return baseDistance + (layerDiff * 30);
    }).strength(function(d) {
      return (d.weight || 1) * 0.1;
    }))
    .force('charge', d3.forceManyBody().strength(function(d) {
      return d.layer === 1 ? -300 : d.layer === 2 ? -250 : d.layer === 3 ? -200 : d.layer === 4 ? -150 : -100;
    }))
    .force('center', d3.forceCenter(W / 2, H / 2).strength(0.015))
    .force('collide', d3.forceCollide().radius(function(d) {
      return (d.size || 12) + (d.layer === 1 ? 10 : d.layer === 2 ? 8 : 6);
    }))
    .force('cluster', function() {
      simNodes.forEach(function(n) {
        var c = dc[n.disc];
        if (c) {
          n.vx = (n.vx || 0) + (c.x - n.x) * 0.014;
          n.vy = (n.vy || 0) + (c.y - n.y) * 0.014;
        }
      });
    })
    .force('layerHierarchy', function() {
      simNodes.forEach(function(n) {
        if (n.layer >= 2) {
          var parentId;
          if (n.layer === 2 && n.domain) {
            parentId = Object.keys(coreDomains).find(function(domainKey) {
              return coreDomains[domainKey].label === n.domain;
            });
          } else if (n.layer === 3 && n.parent_field) {
            parentId = n.parent_field;
          } else if (n.layer === 4 && n.subdiscipline) {
            parentId = n.subdiscipline;
          } else if (n.layer === 5 && n.thematic_domain) {
            parentId = n.thematic_domain;
          }

          if (parentId) {
            var parent = simNodes.find(function(node) { return node.id === parentId; });
            if (parent) {
              n.vx = (n.vx || 0) + (parent.x - n.x) * 0.02;
              n.vy = (n.vy || 0) + (parent.y - n.y) * 0.02;
            }
          }
        }
      });
    });

  // ── Intra-links ───────────────────────────────────────────────
  var intraLinks = simLinks.filter(function (l) { return !l.inter; });
  var intraG = g.append('g').attr('class', 'intra-group');
  var intraSel = intraG.selectAll('line').data(intraLinks).enter().append('line')
    .attr('class', 'intra-link')
    .attr('stroke', function (d) {
      var sid = typeof d.source === 'object' ? d.source.id : d.source;
      var nd = data.nodes.find(function (n) { return n.id === sid; });
      return nd ? (data.disciplines[nd.disc] || { color: '#999' }).color + '28' : '#99999928';
    })
    .attr('stroke-width', function (d) {
      return Math.max(0.5, (d.weight || 1) * 0.45);
    })
    .attr('stroke-linecap', 'round')
    .attr('opacity', function(d) {
      return d.visible ? 1 : 0;
    })
    .attr('display', function(d) {
      return d.visible ? 'inline' : 'none';
    });

  // ── Inter-links (bridges) ─────────────────────────────────────
  var interLinks = simLinks.filter(function (l) { return l.inter; });
  var interG = g.append('g').attr('class', 'inter-group');
  var interSel = interG.selectAll('line').data(interLinks).enter().append('line')
    .attr('class', function (d) {
      return 'inter-link ' + ((d.weight || 1) >= 4 ? 'inter-major' : 'inter-minor');
    })
    .attr('stroke', function (d) {
      if (!d.pair || d.pair.length < 2) return '#1A6BAA77';
      var c1 = (data.disciplines[d.pair[0]] || { color: '#888' }).color;
      var c2 = (data.disciplines[d.pair[1]] || { color: '#888' }).color;
      var blended = blendHex(c1, c2);
      return blended + ((d.weight || 1) >= 4 ? 'bb' : '66');
    })
    .attr('stroke-width', function (d) {
      return (d.weight || 1) >= 4
        ? Math.max(1.5, (d.weight || 1) * 0.9)
        : Math.max(0.7, (d.weight || 1) * 0.5);
    })
    .attr('stroke-dasharray', function (d) {
      return (d.weight || 1) >= 4 ? 'none' : '4 3';
    })
    .attr('stroke-linecap', 'round')
    .attr('opacity', function(d) {
      return d.visible ? 1 : 0;
    })
    .attr('display', function(d) {
      return d.visible ? 'inline' : 'none';
    });

  // ── Node groups ───────────────────────────────────────────────
  var nodeG = g.append('g');
  var nodeSel = nodeG.selectAll('g').data(simNodes).enter().append('g')
    .attr('class', 'nd')
    .attr('role', 'button')
    .attr('tabindex', '0')
    .attr('aria-label', function (d) {
      return 'Concept: ' + d.id + (d.layer ? ' (Layer ' + d.layer + ')' : '');
    })
    .style('cursor', 'pointer')
    .style('opacity', function(d) {
      return d.visible ? 1 : 0;
    })
    .style('display', function(d) {
      return d.visible ? 'inline' : 'none';
    })
    .call(d3.drag()
      .on('start', function (e, d) {
        if (!e.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', function (e, d) {
        d.fx = e.x;
        d.fy = e.y;
      })
      .on('end', function (e, d) {
        if (!e.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      })
    );

  // Node visual elements with layer-specific styling
  nodeSel.append('circle').attr('class', 'sh')
    .attr('r', function (d) {
      return (d.size || 12) + (d.layer === 1 ? 8 : d.layer === 2 ? 5 : d.layer === 3 ? 4 : d.layer === 4 ? 3 : 2);
    })
    .attr('fill', function (d) {
      return nodeColor(d) + (d.layer === 1 ? '18' : d.layer === 2 ? '12' : d.layer === 3 ? '10' : d.layer === 4 ? '08' : '05');
    });

  nodeSel.append('circle').attr('class', 'ri')
    .attr('r', function (d) {
      return (d.size || 12) + (d.layer === 1 ? 6 : d.layer === 2 ? 3 : d.layer === 3 ? 2 : d.layer === 4 ? 1.5 : 1);
    })
    .attr('fill', 'none')
    .attr('stroke', function (d) {
      return nodeColor(d) + (d.layer === 1 ? '44' : d.layer === 2 ? '33' : d.layer === 3 ? '22' : d.layer === 4 ? '18' : '12');
    })
    .attr('stroke-width', function(d) {
      return d.layer === 1 ? 2 : d.layer === 2 ? 1.5 : 1;
    });

  nodeSel.append('circle').attr('class', 'mn')
    .attr('r', function (d) {
      return d.size || (d.layer === 1 ? 15 : d.layer === 2 ? 12 : d.layer === 3 ? 10 : d.layer === 4 ? 8 : 6);
    })
    .attr('fill', function (d) {
      return nodeLight(d);
    })
    .attr('stroke', function (d) {
      return nodeColor(d);
    })
    .attr('stroke-width', function(d) {
      return d.layer === 1 ? 3 : d.layer === 2 ? 2 : 1.5;
    })
    .attr('filter', function (d) {
      if (activeLayer === 'layer') {
        return 'url(#' + layerGlowFilters[d.layer] + ')';
      }
      return 'url(#gid-' + d.disc + ')';
    });

  nodeSel.append('circle').attr('class', 'ac')
    .attr('r', function (d) {
      return Math.max(2, (d.size || 12) * (d.layer === 1 ? 0.4 : d.layer === 2 ? 0.3 : d.layer === 3 ? 0.25 : d.layer === 4 ? 0.2 : 0.15));
    })
    .attr('fill', function (d) {
      return nodeColor(d);
    })
    .attr('opacity', 0.85);

  // Layer indicator (for layer view)
  nodeSel.each(function(d) {
    if (activeLayer === 'layer' && d.layer) {
      const layerColors = {
        1: '#808080',
        2: '#4A90E2',
        3: '#50C878',
        4: '#FFD700',
        5: '#E0FFFF'
      };
      const sz = d.size || 12;
      d3.select(this).append('rect')
        .attr('width', 6)
        .attr('height', 6)
        .attr('x', sz * 0.7)
        .attr('y', -sz * 1.1)
        .attr('fill', layerColors[d.layer] || '#999')
        .attr('rx', 1.5)
        .attr('opacity', 0.9);
    }
  });

  // Epistemic role ring (outer dotted)
  nodeSel.append('circle').attr('class', 'epi-ring')
    .attr('r', function (d) {
      return (d.size || 12) + (d.layer === 1 ? 10 : d.layer === 2 ? 7 : d.layer === 3 ? 5 : d.layer === 4 ? 4 : 3);
    })
    .attr('fill', 'none')
    .attr('stroke', function (d) {
      if (!d.epistemicRole || !data.epistemic) return 'transparent';
      return (data.epistemic[d.epistemicRole] || { color: '#999' }).color + '55';
    })
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '3 2');

  // Analysis level square indicator
  nodeSel.each(function (d) {
    if (d.analysisLevel && data.analysisLevels && data.analysisLevels[d.analysisLevel]) {
      var lv = data.analysisLevels[d.analysisLevel];
      var sz = d.size || 12;
      d3.select(this).append('rect')
        .attr('width', 6)
        .attr('height', 6)
        .attr('x', sz * 0.6)
        .attr('y', -sz * 0.95)
        .attr('fill', lv.color)
        .attr('rx', 1.5)
        .attr('opacity', 0.9);
    }
  });

  // Label
  nodeSel.append('text')
    .text(function (d) {
      if (d.layer >= 4) {
        return d.id.length > 12 ? d.id.substring(0, 10) + '…' : d.id;
      }
      return d.id;
    })
    .attr('text-anchor', 'middle')
    .attr('dy', function (d) {
      return (d.size || 12) + (d.layer === 1 ? 18 : d.layer === 2 ? 16 : d.layer === 3 ? 14 : d.layer === 4 ? 12 : 10);
    })
    .attr('font-family', "'Outfit', sans-serif")
    .attr('font-size', function (d) {
      const baseSize = Math.max(7.5, Math.min(10.5, (d.size || 12) * 0.43));
      return d.layer >= 4 ? baseSize * 0.8 : baseSize;
    })
    .attr('font-weight', '500')
    .attr('fill', function (d) {
      return nodeColor(d);
    })
    .attr('pointer-events', 'none');

  // Discipline sub-label (only for layers 1-2)
  nodeSel.append('text')
    .text(function (d) {
      if (d.layer > 2) return '';
      var disc = data.disciplines[d.disc];
      return disc ? disc.label.split(' ')[0] : '';
    })
    .attr('text-anchor', 'middle')
    .attr('dy', function (d) {
      return (d.size || 12) + (d.layer === 1 ? 28 : d.layer === 2 ? 26 : 0);
    })
    .attr('font-family', "'Space Mono', monospace")
    .attr('font-size', function(d) {
      return d.layer === 1 ? 7 : 6.5;
    })
    .attr('fill', function (d) {
      return nodeColor(d) + '77';
    })
    .attr('pointer-events', 'none');

  // Layer indicator text (for layer view)
  nodeSel.append('text')
    .text(function(d) {
      if (activeLayer !== 'layer' || !d.layer) return '';
      return 'L' + d.layer;
    })
    .attr('text-anchor', 'middle')
    .attr('dy', function(d) {
      return (d.size || 12) + (d.layer === 1 ? 35 : d.layer === 2 ? 30 : d.layer === 3 ? 25 : d.layer === 4 ? 20 : 15);
    })
    .attr('font-family', "'Space Mono', monospace")
    .attr('font-size', 6)
    .attr('fill', '#666')
    .attr('pointer-events', 'none');

  // ── Events ───────────────────────────────────────────────────
  var tip = document.getElementById('tip');
  var detail = document.getElementById('detail');

  function getInterCount(id) {
    return (data.interLinks || []).filter(function (l) {
      return l.source === id || l.target === id || l.s === id || l.t === id;
    }).length;
  }

  function getLayerInfo(d) {
    const layerNames = {
      1: 'Core Domain',
      2: 'Discipline',
      3: 'Subdiscipline',
      4: 'Thematic Domain',
      5: 'Main Thematic'
    };
    return layerNames[d.layer] || 'Unknown Layer';
  }

  nodeSel
    .on('mouseover', function (e, d) {
      if (!d.visible) return;

      // Highlight connected edges
      var col = nodeColor(d);
      intraSel.attr('stroke', function (l) {
        var s = typeof l.source === 'object' ? l.source.id : l.source;
        var t = typeof l.target === 'object' ? l.target.id : l.target;
        if (!l.visible) return '#99999910';
        return (s === d.id || t === d.id) ? col + 'cc' : col + '10';
      }).attr('stroke-width', function (l) {
        var s = typeof l.source === 'object' ? l.source.id : l.source;
        var t = typeof l.target === 'object' ? l.target.id : l.target;
        return (s === d.id || t === d.id) ? Math.max(1.2, (l.weight || 1) * 1.3) : 0.3;
      });

      interSel.attr('stroke', function (l) {
        var s = typeof l.source === 'object' ? l.source.id : l.source;
        var t = typeof l.target === 'object' ? l.target.id : l.target;
        if (!l.visible) return '#33333318';
        if (s !== d.id && t !== d.id) return '#33333318';
        if (!l.pair || l.pair.length < 2) return col + 'cc';
        return blendHex(
          (data.disciplines[l.pair[0]] || { color: '#888' }).color,
          (data.disciplines[l.pair[1]] || { color: '#888' }).color
        ) + 'ee';
      }).attr('stroke-width', function (l) {
        var s = typeof l.source === 'object' ? l.source.id : l.source;
        var t = typeof l.target === 'object' ? l.target.id : l.target;
        return (s === d.id || t === d.id) ? Math.max(2, (l.weight || 1) * 1.6) : 0.3;
      });

      d3.select(this).select('.mn').attr('fill', col + '22').attr('stroke-width', function() {
        return d.layer === 1 ? 4 : d.layer === 2 ? 3 : 2;
      });
      d3.select(this).select('.ri').attr('stroke', col + 'aa').attr('r', function() {
        return (d.size || 12) + (d.layer === 1 ? 8 : d.layer === 2 ? 6 : d.layer === 3 ? 4 : d.layer === 4 ? 3 : 2);
      });

      // Tooltip
      const layerInfo = d.layer ? ' | Layer: ' + getLayerInfo(d) : '';
      tip.textContent = d.id + ' (' + (data.disciplines[d.disc] || { label: '' }).label + layerInfo + ')';
      tip.style.display = 'block';
      tip.style.left = e.clientX + 'px';
      tip.style.top  = e.clientY + 'px';
    })
    .on('mouseout', function (e, d) {
      if (!d.visible) return;

      resetLinkStyles();
      d3.select(this).select('.mn').attr('fill', nodeLight(d)).attr('stroke-width', function() {
        return d.layer === 1 ? 3 : d.layer === 2 ? 2 : 1.5;
      });
      d3.select(this).select('.ri').attr('stroke', nodeColor(d) + (d.layer === 1 ? '44' : d.layer === 2 ? '33' : '22')).attr('r', function() {
        return (d.size || 12) + (d.layer === 1 ? 6 : d.layer === 2 ? 3 : d.layer === 3 ? 2 : d.layer === 4 ? 1.5 : 1);
      });
      tip.style.display = 'none';
    })
    .on('click', function (e, d) {
      if (!d.visible) return;

      e.stopPropagation();

      // Progressive disclosure: Toggle visibility of child nodes
      const childLayers = {
        1: 2, // Core Domain → Disciplines
        2: 3, // Discipline → Subdisciplines
        3: 4, // Subdiscipline → Thematic Domains
        4: 5  // Thematic Domain → Main Thematics
      };

      const targetLayer = childLayers[d.layer];
      if (targetLayer) {
        // Toggle visibility of child nodes
        simNodes.forEach(function(n) {
          if (n.layer === targetLayer) {
            if (n.parent_field === d.id || n.subdiscipline === d.id || n.thematic_domain === d.id) {
              n.visible = !n.visible;
            }
          }
        });

        // Toggle visibility of child edges
        simLinks.forEach(function(l) {
          var s = typeof l.source === 'object' ? l.source.id : l.source;
          var t = typeof l.target === 'object' ? l.target.id : l.target;
          if (s === d.id || t === d.id) {
            const otherEnd = s === d.id ? t : s;
            const otherNode = simNodes.find(n => n.id === otherEnd);
            if (otherNode && otherNode.layer === targetLayer) {
              l.visible = !l.visible;
            }
          }
        });

        updateVisibility();
        sim.alpha(0.3).restart();
      }

      showDetail(d);
    })
    .on('keydown', function (e, d) {
      if (!d.visible) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(e, d); }
    });

  svg.on('click', function () {
    detail.style.display = 'none';
    tip.style.display = 'none';
  });

  // Function to update visibility of nodes and links
  function updateVisibility() {
    nodeSel
      .style('opacity', function(d) { return d.visible ? 1 : 0; })
      .style('display', function(d) { return d.visible ? 'inline' : 'none'; });

    intraSel
      .style('opacity', function(d) { return d.visible ? 1 : 0; })
      .style('display', function(d) { return d.visible ? 'inline' : 'none'; });

    interSel
      .style('opacity', function(d) { return d.visible ? 1 : 0; })
      .style('display', function(d) { return d.visible ? 'inline' : 'none'; });
  }

  function resetLinkStyles() {
    intraSel
      .attr('stroke', function (l) {
        if (!l.visible) return '#99999910';
        var sid = typeof l.source === 'object' ? l.source.id : l.source;
        var nd = data.nodes.find(function (n) { return n.id === sid; });
        return nd ? (data.disciplines[nd.disc] || { color: '#999' }).color + '28' : '#99999928';
      })
      .attr('stroke-width', function (l) {
        return l.visible ? Math.max(0.5, (l.weight || 1) * 0.45) : 0;
      });

    interSel
      .attr('stroke', function (l) {
        if (!l.visible) return '#33333318';
        if (!l.pair || l.pair.length < 2) return '#1A6BAA55';
        var c1 = (data.disciplines[l.pair[0]] || { color: '#888' }).color;
        var c2 = (data.disciplines[l.pair[1]] || { color: '#888' }).color;
        return blendHex(c1, c2) + ((l.weight || 1) >= 4 ? 'bb' : '66');
      })
      .attr('stroke-width', function (l) {
        return l.visible ? ((l.weight || 1) >= 4
          ? Math.max(1.5, (l.weight || 1) * 0.9)
          : Math.max(0.7, (l.weight || 1) * 0.5)) : 0;
      });
  }

  // Tick
  sim.on('tick', function () {
    intraSel
      .attr('x1', function (d) {
        var s = typeof d.source === 'object' ? d.source : simNodes.find(n => n.id === d.source);
        return s ? s.x : 0;
      })
      .attr('y1', function (d) {
        var s = typeof d.source === 'object' ? d.source : simNodes.find(n => n.id === d.source);
        return s ? s.y : 0;
      })
      .attr('x2', function (d) {
        var t = typeof d.target === 'object' ? d.target : simNodes.find(n => n.id === d.target);
        return t ? t.x : 0;
      })
      .attr('y2', function (d) {
        var t = typeof d.target === 'object' ? d.target : simNodes.find(n => n.id === d.target);
        return t ? t.y : 0;
      });

    interSel
      .attr('x1', function (d) {
        var s = typeof d.source === 'object' ? d.source : simNodes.find(n => n.id === d.source);
        return s ? s.x : 0;
      })
      .attr('y1', function (d) {
        var s = typeof d.source === 'object' ? d.source : simNodes.find(n => n.id === d.source);
        return s ? s.y : 0;
      })
      .attr('x2', function (d) {
        var t = typeof d.target === 'object' ? d.target : simNodes.find(n => n.id === d.target);
        return t ? t.x : 0;
      })
      .attr('y2', function (d) {
        var t = typeof d.target === 'object' ? d.target : simNodes.find(n => n.id === d.target);
        return t ? t.y : 0;
      });

    nodeSel.attr('transform', function (d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    });
  });

  document.getElementById('loading').style.display = 'none';

  // ── Resize ────────────────────────────────────────────────────
  var ro = new ResizeObserver(function () {
    W = mount.clientWidth; H = mount.clientHeight;
    svg.attr('width', W).attr('height', H);
    sim.force('center', d3.forceCenter(W / 2, H / 2));
    sim.alpha(0.3).restart();
  });
  ro.observe(mount);

  // ── Legend ────────────────────────────────────────────────────
  function buildLegend() {
    var leg = document.getElementById('legend');
    leg.innerHTML = '';

    var map, titleText;
    if (activeLayer === 'disc') {
      map = data.disciplines;
      titleText = 'Disciplines';
    } else if (activeLayer === 'epist') {
      map = data.epistemic;
      titleText = 'Epistemic Roles';
    } else if (activeLayer === 'level') {
      map = data.analysisLevels;
      titleText = 'Analysis Levels';
    } else if (activeLayer === 'layer') {
      map = {
        1: { label: 'Core Domains', color: '#808080' },
        2: { label: 'Disciplines', color: '#4A90E2' },
        3: { label: 'Subdisciplines', color: '#50C878' },
        4: { label: 'Thematic Domains', color: '#FFD700' },
        5: { label: 'Main Thematics', color: '#E0FFFF' }
      };
      titleText = 'Knowledge Layers';
    }

    var title = document.createElement('div');
    title.className = 'legend-title';
    title.textContent = titleText;
    leg.appendChild(title);

    // Link type legend
    var typeDiv = document.createElement('div');
    typeDiv.innerHTML =
      '<div style="font-family:var(--mono);font-size:8px;color:var(--muted);letter-spacing:.18em;text-transform:uppercase;margin:6px 0 4px">Bridge Types</div>' +
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-family:var(--mono);font-size:9px;color:var(--text2)">' +
        '<div style="width:22px;height:2.5px;background:#1A6BAA;border-radius:2px"></div>Major (≥4)' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-family:var(--mono);font-size:9px;color:var(--text2)">' +
        '<div style="width:22px;height:1.5px;border-top:1.5px dashed #888"></div>Minor (2–3)' +
      '</div>' +
      '<div style="height:1px;background:var(--border);margin-bottom:6px"></div>';
    leg.appendChild(typeDiv);

    var clearBtn = document.createElement('div');
    clearBtn.className = 'legend-clear';
    clearBtn.textContent = '[ show all ]';
    clearBtn.style.display = 'none';
    clearBtn.addEventListener('click', function () {
      activeFilter = null;
      applyFilters();
      leg.querySelectorAll('.legend-item').forEach(function (el) {
        el.classList.remove('active');
        el.style.background = 'transparent';
        el.style.borderColor = 'transparent';
      });
      clearBtn.style.display = 'none';
    });

    Object.keys(map).forEach(function (k) {
      var entry = map[k];
      var color = entry.color;
      var label = entry.label || entry.icon + ' ' + entry.label;
      var item = document.createElement('div');
      item.className = 'legend-item';
      item.setAttribute('role', 'button'); item.setAttribute('tabindex', '0');
      item.innerHTML =
        '<div class="legend-dot" style="background:' + color + ';box-shadow:0 0 0 2px ' + color + '33"></div>' +
        '<span class="legend-label" style="color:var(--text2)">' + (entry.icon ? entry.icon + ' ' : '') + entry.label + '</span>';

      var toggle = function () {
        var was = activeFilter === k;
        activeFilter = was ? null : k;
        leg.querySelectorAll('.legend-item').forEach(function (el) {
          el.classList.remove('active');
          el.style.background = 'transparent'; el.style.borderColor = 'transparent';
        });
        clearBtn.style.display = 'none';
        if (!was) {
          item.classList.add('active');
          item.style.background = color + '14'; item.style.borderColor = color + '55';
          clearBtn.style.display = 'block';
        }
        applyFilters();
      };
      item.addEventListener('click', toggle);
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
      leg.appendChild(item);
    });
    leg.appendChild(clearBtn);
  }

  buildLegend();

  // ── Filter logic ──────────────────────────────────────────────
  function applyFilters() {
    // Nodes
    nodeSel.style('opacity', function (d) {
      if (!d.visible) return 0;

      if (bridgesOnly) {
        var hasInter = (data.interLinks || []).some(function (l) {
          return l.source === d.id || l.target === d.id || l.s === d.id || l.t === d.id;
        });
        if (!hasInter) return 0.06;
      }

      if (!activeFilter) return 1;

      if (activeLayer === 'disc')  return d.disc === activeFilter ? 1 : 0.06;
      if (activeLayer === 'epist') return d.epistemicRole === activeFilter ? 1 : 0.06;
      if (activeLayer === 'level') return d.analysisLevel === activeFilter ? 1 : 0.06;
      if (activeLayer === 'layer') return d.layer == activeFilter ? 1 : 0.06;

      return 1;
    }).style('display', function(d) {
      if (!d.visible) return 'none';
      if (!activeFilter) return 'inline';

      if (activeLayer === 'disc')  return d.disc === activeFilter ? 'inline' : 'none';
      if (activeLayer === 'epist') return d.epistemicRole === activeFilter ? 'inline' : 'none';
      if (activeLayer === 'level') return d.analysisLevel === activeFilter ? 'inline' : 'none';
      if (activeLayer === 'layer') return d.layer == activeFilter ? 'inline' : 'none';

      return 'inline';
    });

    // Intra-links
    intraSel.style('opacity', function (d) {
      if (!d.visible) return 0;

      if (bridgesOnly) return 0;

      if (!activeFilter) return 1;

      var sourceDisc = (typeof d.source === 'object') ? d.source.disc : data.nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source))?.disc;
      var targetDisc = (typeof d.target === 'object') ? d.target.disc : data.nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target))?.disc;

      if (activeLayer === 'disc') {
        return (sourceDisc === activeFilter && targetDisc === activeFilter) ? 1 : 0;
      }
      if (activeLayer === 'epist') {
        var sourceNode = data.nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
        var targetNode = data.nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
        return (sourceNode && targetNode &&
                sourceNode.epistemicRole === activeFilter &&
                targetNode.epistemicRole === activeFilter) ? 1 : 0;
      }
      if (activeLayer === 'level') {
        var sourceNode = data.nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
        var targetNode = data.nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
        return (sourceNode && targetNode &&
                sourceNode.analysisLevel === activeFilter &&
                targetNode.analysisLevel === activeFilter) ? 1 : 0;
      }
      if (activeLayer === 'layer') {
        var sourceNode = data.nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
        var targetNode = data.nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
        return (sourceNode && targetNode &&
                sourceNode.layer === activeFilter &&
                targetNode.layer === activeFilter) ? 1 : 0;
      }

      return 1;
    }).style('display', function(d) {
      if (!d.visible) return 'none';
      if (bridgesOnly) return 'none';

      if (!activeFilter) return 'inline';

      var sourceDisc = (typeof d.source === 'object') ? d.source.disc : data.nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source))?.disc;
      var targetDisc = (typeof d.target === 'object') ? d.target.disc : data.nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target))?.disc;

      if (activeLayer === 'disc') {
        return (sourceDisc === activeFilter && targetDisc === activeFilter) ? 'inline' : 'none';
      }
      if (activeLayer === 'epist') {
        var sourceNode = data.nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
        var targetNode = data.nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
        return (sourceNode && targetNode &&
                sourceNode.epistemicRole === activeFilter &&
                targetNode.epistemicRole === activeFilter) ? 'inline' : 'none';
      }
      if (activeLayer === 'level') {
        var sourceNode = data.nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
        var targetNode = data.nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
        return (sourceNode && targetNode &&
                sourceNode.analysisLevel === activeFilter &&
                targetNode.analysisLevel === activeFilter) ? 'inline' : 'none';
      }
      if (activeLayer === 'layer') {
        var sourceNode = data.nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
        var targetNode = data.nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
        return (sourceNode && targetNode &&
                sourceNode.layer === activeFilter &&
                targetNode.layer === activeFilter) ? 'inline' : 'none';
      }

      return 'inline';
    });

    // Inter-links
    interSel.style('opacity', function (d) {
      if (!d.visible) return 0;

      if (bridgesOnly) return 1;

      if (!activeFilter) return 1;

      if (activeLayer === 'disc') return 0;
      if (activeLayer === 'epist') {
        var sourceNode = data.nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
        var targetNode = data.nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
        return (sourceNode && targetNode &&
                (sourceNode.epistemicRole === activeFilter ||
                 targetNode.epistemicRole === activeFilter)) ? 1 : 0;
      }
      if (activeLayer === 'level') {
        var sourceNode = data.nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
        var targetNode = data.nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
        return (sourceNode && targetNode &&
                (sourceNode.analysisLevel === activeFilter ||
                 targetNode.analysisLevel === activeFilter)) ? 1 : 0;
      }
      if (activeLayer === 'layer') {
        var sourceNode = data.nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
        var targetNode = data.nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
        return (sourceNode && targetNode &&
                (sourceNode.layer === activeFilter ||
                 targetNode.layer === activeFilter)) ? 1 : 0;
      }

      return 1;
    }).style('display', function(d) {
      if (!d.visible) return 'none';
      if (bridgesOnly) return 'inline';

      if (!activeFilter) return 'inline';

      if (activeLayer === 'disc') return 'none';
      if (activeLayer === 'epist') {
        var sourceNode = data.nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
        var targetNode = data.nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
        return (sourceNode && targetNode &&
                (sourceNode.epistemicRole === activeFilter ||
                 targetNode.epistemicRole === activeFilter)) ? 'inline' : 'none';
      }
      if (activeLayer === 'level') {
        var sourceNode = data.nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
        var targetNode = data.nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
        return (sourceNode && targetNode &&
                (sourceNode.analysisLevel === activeFilter ||
                 targetNode.analysisLevel === activeFilter)) ? 'inline' : 'none';
      }
      if (activeLayer === 'layer') {
        var sourceNode = data.nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
        var targetNode = data.nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
        return (sourceNode && targetNode &&
                (sourceNode.layer === activeFilter ||
                 targetNode.layer === activeFilter)) ? 'inline' : 'none';
      }

      return 'inline';
    });

    // Restyle node colours per layer
    nodeSel.select('.mn').attr('fill', nodeLight).attr('stroke', nodeColor);
    nodeSel.select('.ac').attr('fill', nodeColor);
    nodeSel.select('.sh').attr('fill', function (d) { return nodeColor(d) + '12'; });
    nodeSel.select('.ri').attr('stroke', function (d) { return nodeColor(d) + '44'; });
  }

  // ── Layer tabs ────────────────────────────────────────────────
  function setLayer(layer) {
    activeLayer = layer;
    activeFilter = null;
    buildLegend();
    applyFilters();
    ['tab-disc', 'tab-epist', 'tab-level', 'tab-layer'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.classList.remove('active');
        el.setAttribute('aria-pressed', 'false');
      }
    });
    var tabMap = { disc: 'tab-disc', epist: 'tab-epist', level: 'tab-level', layer: 'tab-layer' };
    var activeTab = document.getElementById(tabMap[layer]);
    if (activeTab) {
      activeTab.classList.add('active');
      activeTab.setAttribute('aria-pressed', 'true');
    }
  }

  // Add new tab for layers
  var layerTab = document.createElement('button');
  layerTab.id = 'tab-layer';
  layerTab.className = 'tab-btn';
  layerTab.textContent = 'Layers';
  layerTab.setAttribute('aria-pressed', 'false');
  layerTab.addEventListener('click', function () { setLayer('layer'); });
  document.getElementById('tab-disc').parentNode.appendChild(layerTab);

  document.getElementById('tab-disc').addEventListener('click',  function () { setLayer('disc'); });
  document.getElementById('tab-epist').addEventListener('click', function () { setLayer('epist'); });
  document.getElementById('tab-level').addEventListener('click', function () { setLayer('level'); });

  document.getElementById('tab-bridges').addEventListener('click', function () {
    bridgesOnly = !bridgesOnly;
    this.classList.toggle('active', bridgesOnly);
    this.setAttribute('aria-pressed', String(bridgesOnly));
    this.textContent = bridgesOnly ? '⇄ All Links' : '⇄ Bridges Only';
    applyFilters();
  });

  // ── Toolbar ───────────────────────────────────────────────────
  document.getElementById('tb-zi').addEventListener('click', function () {
    svg.transition().call(zoom.scaleBy, 1.4);
  });
  document.getElementById('tb-zo').addEventListener('click', function () {
    svg.transition().call(zoom.scaleBy, 0.7);
  });
  document.getElementById('tb-reset').addEventListener('click', function () {
    svg.transition().call(zoom.transform, d3.zoomIdentity);
  });
  document.getElementById('tb-hubs').addEventListener('click', function () {
    hubsOn = !hubsOn;
    this.classList.toggle('active', hubsOn);
    if (hubsOn) {
      var st = GraphStats.networkStats(data.nodes, simLinks);
      var hubIds = st.hubs.map(function (h) { return h.id; });
      nodeSel.style('opacity', function (d) { return hubIds.indexOf(d.id) !== -1 ? 1 : 0.1; });
      nodeSel.filter(function (d) { return hubIds.indexOf(d.id) !== -1; })
        .select('.mn').attr('stroke-width', 5);
    } else {
      applyFilters();
      nodeSel.select('.mn').attr('stroke-width', function(d) {
        return d.layer === 1 ? 3 : d.layer === 2 ? 2 : 1.5;
      });
    }
  });
  document.getElementById('tb-stats').addEventListener('click', function () {
    statsVisible = !statsVisible;
    this.classList.toggle('active', statsVisible);
    document.getElementById('stats-panel').style.display = statsVisible ? '' : 'none';
  });

  // ── Statistics panel ──────────────────────────────────────────
  var allStats = GraphStats.networkStats(data.nodes, simLinks);
  var sp = document.getElementById('stats-panel');
  GraphStats.renderStats(sp, allStats);

  // Append bridge count info and layer info
  var bridgeInfo = document.createElement('div');
  bridgeInfo.innerHTML =
    '<div class="stats-title" style="margin-top:8px">Interdisciplinary Bridges</div>' +
    '<div class="stat-row"><span class="stat-lbl">Major (wt≥4)</span>' +
    '<span class="stat-val">' + (data.interLinks || []).filter(function (l) { return l.weight >= 4; }).length + '</span></div>' +
    '<div class="stat-row"><span class="stat-lbl">Minor (wt 2–3)</span>' +
    '<span class="stat-val">' + (data.interLinks || []).filter(function (l) { return l.weight < 4; }).length + '</span></div>' +
    '<div class="stat-row"><span class="stat-lbl">Disciplines</span>' +
    '<span class="stat-val">' + (data.metadata ? data.metadata.totalDisciplines : 26) + '</span></div>' +
    '<div class="stats-title" style="margin-top:12px">Knowledge Layers</div>' +
    '<div class="stat-row"><span class="stat-lbl">Core Domains</span>' +
    '<span class="stat-val">' + (data.nodes.filter(n => n.layer === 1).length) + '</span></div>' +
    '<div class="stat-row"><span class="stat-lbl">Disciplines</span>' +
    '<span class="stat-val">' + (data.nodes.filter(n => n.layer === 2).length) + '</span></div>' +
    '<div class="stat-row"><span class="stat-lbl">Subdisciplines</span>' +
    '<span class="stat-val">' + (data.nodes.filter(n => n.layer === 3).length) + '</span></div>' +
    '<div class="stat-row"><span class="stat-lbl">Thematic Domains</span>' +
    '<span class="stat-val">' + (data.nodes.filter(n => n.layer === 4).length) + '</span></div>' +
    '<div class="stat-row"><span class="stat-lbl">Main Thematics</span>' +
    '<span class="stat-val">' + (data.nodes.filter(n => n.layer === 5).length) + '</span></div>';
  sp.appendChild(bridgeInfo);

  // ── Detail panel ──────────────────────────────────────────────
  function showDetail(d) {
    var disc = data.disciplines[d.disc] || { label: '', color: '#333' };
    var ns = GraphStats.nodeStats(d.id, data.nodes, simLinks);
    var interCount = getInterCount(d.id);
    var epRole = d.epistemicRole && data.epistemic ? (data.epistemic[d.epistemicRole] || {}) : {};
    var anLevel = d.analysisLevel && data.analysisLevels ? (data.analysisLevels[d.analysisLevel] || {}) : {};
    var layerInfo = getLayerInfo(d);

    // Neighbour tags
    var nbrs = new Set();
    simLinks.forEach(function (l) {
      var s = typeof l.source === 'object' ? l.source.id : l.source;
      var t = typeof l.target === 'object' ? l.target.id : l.target;
      if (s === d.id) nbrs.add({ id: t, inter: l.inter });
      if (t === d.id) nbrs.add({ id: s, inter: l.inter });
    });
    // de-dup
    var nbrMap = {};
    simLinks.forEach(function (l) {
      var s = typeof l.source === 'object' ? l.source.id : l.source;
      var t = typeof l.target === 'object' ? l.target.id : l.target;
      if (s === d.id) nbrMap[t] = nbrMap[t] || l.inter;
      if (t === d.id) nbrMap[s] = nbrMap[s] || l.inter;
    });
    var tags = Object.keys(nbrMap).map(function (id) {
      var nd = data.nodes.find(function (n) { return n.id === id; });
      if (!nd) return '';
      var nc = (data.disciplines[nd.disc] || { color: '#333' }).color;
      var isBridge = nbrMap[id];
      return '<span class="dtag" style="color:' + nc + ';border-color:' + nc + (isBridge ? '99' : '33') + ';' +
        (isBridge ? 'font-weight:700' : '') + '">' +
        (isBridge ? '⇄ ' : '') + id + (nd.layer ? ' (L' + nd.layer + ')' : '') + '</span>';
    }).join('');

    detail.innerHTML =
      '<div class="detail-badge">' +
        '<div class="detail-dot" style="background:' + disc.color + '"></div>' +
        '<span class="detail-cluster" style="color:' + disc.color + '">' + disc.label + '</span>' +
      '</div>' +
      '<div class="detail-name">' + d.id + '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' +
        (epRole.label ? '<span style="font-family:var(--mono);font-size:8px;padding:3px 8px;border-radius:10px;background:' + (epRole.color || '#888') + '18;color:' + (epRole.color || '#888') + ';border:1px solid ' + (epRole.color || '#888') + '33">' + (epRole.icon || '') + ' ' + epRole.label + '</span>' : '') +
        (anLevel.label ? '<span style="font-family:var(--mono);font-size:8px;padding:3px 8px;border-radius:10px;background:' + (anLevel.color || '#888') + '18;color:' + (anLevel.color || '#888') + ';border:1px solid ' + (anLevel.color || '#888') + '33">◎ ' + anLevel.label + '</span>' : '') +
        (d.layer ? '<span style="font-family:var(--mono);font-size:8px;padding:3px 8px;border-radius:10px;background:#80808018;color:#808080;border:1px solid #80808033">◐ Layer ' + d.layer + ': ' + layerInfo + '</span>' : '') +
        (interCount > 0 ? '<span style="font-family:var(--mono);font-size:8px;padding:3px 8px;border-radius:10px;background:#1A6BAA18;color:#1A6BAA;border:1px solid #1A6BAA33">⇄ ' + interCount + ' bridge' + (interCount > 1 ? 's' : '') + '</span>' : '') +
      '</div>' +
      '<div class="detail-metrics">' +
        '<div class="dmet"><div class="dmet-val">' + ns.deg + '</div><div class="dmet-lbl">Degree</div></div>' +
        '<div class="dmet"><div class="dmet-val">' + GraphStats.fmt(ns.wDeg, 1) + '</div><div class="dmet-lbl">Wt. Degree</div></div>' +
        '<div class="dmet"><div class="dmet-val">' + GraphStats.fmt(ns.cc, 3) + '</div><div class="dmet-lbl">Clustering</div></div>' +
        '<div class="dmet"><div class="dmet-val">' + interCount + '</div><div class="dmet-lbl">Bridges</div></div>' +
      '</div>' +
      '<div class="detail-nbr-lbl">Connected (' + Object.keys(nbrMap).length + ') — ⇄ = inter-discipline</div>' +
      '<div class="detail-tags">' + tags + '</div>';

    detail.style.borderLeftColor = disc.color;
    detail.style.display = 'block';
  }

  // ── Search ────────────────────────────────────────────────────
  var srch = document.getElementById('srch-input'), srchT;
  srch.addEventListener('input', function () {
    clearTimeout(srchT);
    srchT = setTimeout(function () {
      var q = srch.value.trim().toLowerCase();
      nodeSel.style('opacity', function (d) {
        if (!d.visible) return 0;
        return !q || d.id.toLowerCase().indexOf(q) !== -1 ? 1 : 0.06;
      });
    }, 150);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { detail.style.display = 'none'; }
  });

  // Initialize with default visibility
  updateVisibility();
});
