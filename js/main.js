/* ============================================================
   Netflix's Global Pivot — Landing Page Interactions
   ============================================================ */

   (() => {
    'use strict';
  
    /* ---------------------------------------------------------
       1. Reveal-on-load (fade-in-up) for .reveal elements
       --------------------------------------------------------- */
    const triggerReveals = () => {
      const items = document.querySelectorAll('.reveal');
      items.forEach((el) => {
        const delay = Number(el.dataset.delay) || 0;
        window.setTimeout(() => el.classList.add('is-visible'), delay);
      });
    };
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        requestAnimationFrame(triggerReveals);
      });
    } else {
      requestAnimationFrame(triggerReveals);
    }
  
    /* ---------------------------------------------------------
       2. Navbar background swap on scroll
       --------------------------------------------------------- */
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      const onScroll = () => {
        if (window.scrollY > 60) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  
    /* ---------------------------------------------------------
       3. Subtle parallax on the hero background image
       --------------------------------------------------------- */
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const heroBg = document.querySelector('.hero-bg');
    
    if (heroBg && !prefersReducedMotion) {
      let ticking = false;
      const updateParallax = () => {
        const y = window.scrollY;
        if (y < window.innerHeight) {
          heroBg.style.transform = `translate3d(0, ${y * 0.25}px, 0) scale(1.02)`;
        }
        ticking = false;
      };
  
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      }, { passive: true });
    }
  
    /* ---------------------------------------------------------
       4. Navigation Handlers
       ---------------------------------------------------------
       (Removed) The hero "Exploration" CTA used to be a <button>
       that scrolled to the old "2015 Flood" section via JS.
       It is now an <a href="#soft-power-intro"> that relies on the
       site-wide `html { scroll-behavior: smooth }` rule, so no JS
       handler is needed.
       --------------------------------------------------------- */

    /* ---------------------------------------------------------
       5. Quiz → Reveal interaction (data-driven, supports
          multiple independent quiz/reveal pairs on the page)
       --------------------------------------------------------- */
    /** Filled by initReveal2VolumeBar — Quiz #2 bar chart intro */
    let animateQuiz2Chart = null;

    const quizSections = document.querySelectorAll('.quiz-section');

    quizSections.forEach((section) => {
      const options = section.querySelectorAll('.quiz-option');
      if (!options.length) return;

      const correctAnswer = section.dataset.quizCorrect || null;

      const handleQuizChoice = (choiceButton) => {
        const choice = choiceButton.dataset.quizChoice || 'that';
        const targetId = choiceButton.dataset.quizTarget;
        const feedbackId = choiceButton.dataset.quizFeedback;
        const reveal = targetId ? document.getElementById(targetId) : null;
        const feedback = feedbackId ? document.getElementById(feedbackId) : null;
        const isCorrect = correctAnswer !== null && choice === correctAnswer;

        // Mark active option + correct/incorrect state
        options.forEach((btn) => {
          const isActive = btn === choiceButton;
          btn.classList.toggle('is-selected', isActive);
          btn.classList.toggle('is-correct', isActive && isCorrect);
          btn.classList.toggle('is-incorrect', isActive && !isCorrect && correctAnswer !== null);
          btn.setAttribute('aria-pressed', String(isActive));
        });

        // Feedback message — green "You're right!" when correct,
        // neutral "Interesting choice…" otherwise.
        if (feedback) {
          if (isCorrect) {
            feedback.textContent = "You're right! Let's look at the data...";
            feedback.classList.add('is-correct');
            feedback.classList.remove('is-incorrect');
          } else {
            feedback.textContent = `Interesting choice — ${choice}! Let's look at the data...`;
            feedback.classList.remove('is-correct');
            feedback.classList.add('is-incorrect');
          }
          feedback.classList.add('is-visible');
        }

        if (!reveal) return;

        // Unfold the reveal (max-height + opacity transition).
        reveal.classList.add('is-visible');

        if (targetId === 'reveal-2' && typeof animateQuiz2Chart === 'function') {
          animateQuiz2Chart();
        }

        // If this reveal lives inside .poll-stack-pinned (i.e., Quiz #1's
        // sticky card), flag the parent .poll-stack so the CSS can switch
        // the pinned card out of sticky mode. Otherwise the user can never
        // scroll through the expanded answer — sticky locks it at top: 0
        // and Quiz #2 starts stacking before the chart is visible.
        if (reveal.closest('.poll-stack-pinned')) {
          const stackParent = reveal.closest('.poll-stack');
          if (stackParent) stackParent.classList.add('is-revealed');
        }

        // Smoothly scroll to the start of the revealed content.
        // Wait one frame so the unfold transition has a chance to begin
        // before the scroll target is computed, then a brief delay so the
        // user reads the feedback message first.
        window.setTimeout(() => {
          requestAnimationFrame(() => {
            reveal.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }, 650);
      };

      options.forEach((option) => {
        option.setAttribute('aria-pressed', 'false');
        option.addEventListener('click', () => handleQuizChoice(option));
      });
    });

    /* ---------------------------------------------------------
       6. Genre Dominance — scroll-driven fade + lift on the
          hook heading as the user scrolls through the sticky
          travel zone (the second 100 vh of .genre-hook-outer)
       --------------------------------------------------------- */
    const genreHookOuter = document.querySelector('.genre-hook-outer');
    const genreHookTitle = document.querySelector('.genre-hook-title');

    if (genreHookOuter && genreHookTitle) {
      const applyGenreFade = () => {
        const rect  = genreHookOuter.getBoundingClientRect();
        const travel = window.innerHeight; // 100 vh
        // -rect.top = how far we have scrolled into the outer wrapper.
        // Fade starts once the sticky panel is fully in view (rect.top <= 0).
        const scrolled  = Math.max(0, -rect.top);
        const progress  = Math.min(1, scrolled / travel);

        if (!prefersReducedMotion) {
          genreHookTitle.style.opacity   = String(1 - progress);
          genreHookTitle.style.transform = `translateY(${-progress * 48}px)`;
        }
      };

      window.addEventListener('scroll', applyGenreFade, { passive: true });
      applyGenreFade();
    }

    /* ---------------------------------------------------------
       6b. Genre Distribution — animated vertical bar chart
           18 genres ranked left → right, highest to lowest. When
           the chart enters the viewport, EVERY bar starts growing
           at the exact same moment — height: 0% → target % over
           1.5 s with a smooth ease-out. The synchronous launch
           creates a "sprouting" / "exploding" feel rather than a
           staggered wave. Bar fills are a Netflix-red ramp that
           fades from #E50914 (Drama) to a pale salmon for the
           long-tail genres. After the bars finish, all 18 % labels
           fade in together.
       --------------------------------------------------------- */
    const genreBarChart = document.getElementById('chart-genre-distribution');

    if (genreBarChart && genreBarChart.classList.contains('genre-bar-chart')) {
      const cols = Array.from(genreBarChart.querySelectorAll('.genre-bar-col'));

      const Y_AXIS_MAX = 50;     // y-axis ceiling matches Drama's 50%
      const GROW_MS    = 4000;   // synchronized grow duration
      const EASE       = 'cubic-bezier(0.22, 1, 0.36, 1)';

      // Build the red gradient from rank.
      // Rank 1 (Drama) is locked to the exact Netflix Red (#E50914);
      // ranks 2 → 18 fade through HSL toward pale salmon so the
      // descending magnitude reads at a glance.
      const total = cols.length;
      cols.forEach((col, i) => {
        if (i === 0) {
          col.style.setProperty('--bar-color',   '#e50914');
          col.style.setProperty('--bar-color-d', '#a30610');
          return;
        }
        const t     = i / Math.max(1, total - 1);   // 0 → ~1
        const sat   = Math.round(85 - t * 32);      // 85% → ~53%
        const light = Math.round(50 + t * 36);      // 50% → ~86%
        col.style.setProperty(
          '--bar-color',
          `hsl(356, ${sat}%, ${light}%)`
        );
        col.style.setProperty(
          '--bar-color-d',
          `hsl(356, ${sat}%, ${Math.max(22, light - 14)}%)`
        );
      });

      const setFinalHeights = () => {
        cols.forEach((col) => {
          const target = parseFloat(col.style.getPropertyValue('--target')) || 0;
          const shape  = col.querySelector('.genre-bar-shape');
          if (!shape) return;
          shape.style.transition = 'none';
          shape.style.height = `${(target / Y_AXIS_MAX) * 100}%`;
          col.classList.add('is-finished');
        });
      };

      const animateBars = () => {
        // Phase 1 — kick every bar off in the same frame.
        cols.forEach((col) => {
          const target = parseFloat(col.style.getPropertyValue('--target')) || 0;
          const shape  = col.querySelector('.genre-bar-shape');
          if (!shape) return;

          const finalH = (target / Y_AXIS_MAX) * 100;
          shape.style.transition = `height ${GROW_MS}ms ${EASE}`;

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              shape.style.height = `${finalH}%`;
            });
          });
        });

        // Phase 2 — once every bar has reached its target, fade in
        // all 18 % labels at once.
        window.setTimeout(() => {
          cols.forEach((col) => col.classList.add('is-finished'));
        }, GROW_MS + 40);
      };

      if (prefersReducedMotion) {
        setFinalHeights();
      } else if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                animateBars();
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.25, rootMargin: '0px 0px -10% 0px' }
        );
        observer.observe(genreBarChart);
      } else {
        animateBars();
      }
    }

    /* ---------------------------------------------------------
       6c. Market Share — D3 small multiples (Global Content Dominance)
           CSV: netflix_cleaned_categorized 2.csv (distinct id + genre, valid IMDb score).
       --------------------------------------------------------- */
    const initMarketShareSmallMultiples = () => {
      if (typeof window.d3 === 'undefined') return;

      const d3 = window.d3;
      const container = document.getElementById('market-share-facets-container');
      const tooltip = document.getElementById('market-share-facets-tooltip');
      const statusEl = document.getElementById('market-share-facets-status');
      if (!container || !tooltip) return;

      const TOP_N_COUNTRIES = 12;
      const CSV_URL = new URL(
        'netflix_cleaned_categorized 2.csv',
        window.location.href
      ).href;
      const FONT_STACK = '"Montserrat", "Urbanist", system-ui, -apple-system, sans-serif';

      const setStatus = (text, isError) => {
        if (!statusEl) return;
        statusEl.textContent = text;
        statusEl.hidden = !text;
        statusEl.classList.toggle('market-share-facets__status--error', Boolean(isError));
      };

      const hideTip = () => {
        tooltip.hidden = true;
        tooltip.classList.remove('is-visible');
      };

      const moveTip = (event) => {
        const pad = 14;
        const rect = tooltip.getBoundingClientRect();
        let x = event.clientX + pad;
        let y = event.clientY - pad;
        if (x + rect.width > window.innerWidth - 8) {
          x = event.clientX - rect.width - pad;
        }
        if (y + rect.height > window.innerHeight - 8) {
          y = event.clientY - rect.height - pad;
        }
        tooltip.style.left = `${Math.max(8, x)}px`;
        tooltip.style.top = `${Math.max(8, y)}px`;
      };

      const COUNTRY_DISPLAY = {
        US: 'United States',
        GB: 'United Kingdom',
        IN: 'India',
        JP: 'Japan',
        KR: 'South Korea',
        FR: 'France',
        CA: 'Canada',
        DE: 'Germany',
        ES: 'Spain',
        MX: 'Mexico',
        BR: 'Brazil',
        AU: 'Australia',
        IT: 'Italy',
        CN: 'China',
        NL: 'Netherlands',
        SE: 'Sweden',
        NO: 'Norway',
        TR: 'Turkey',
        PL: 'Poland',
        AR: 'Argentina',
        BE: 'Belgium',
        CH: 'Switzerland',
        AT: 'Austria',
        PT: 'Portugal',
        RU: 'Russia',
        IE: 'Ireland',
        NZ: 'New Zealand',
        ZA: 'South Africa',
        EG: 'Egypt',
        NG: 'Nigeria',
        RO: 'Romania',
        CZ: 'Czech Republic',
      };

      const countryDisplay = (code) =>
        COUNTRY_DISPLAY[code] || String(code || '').trim() || 'Unknown';

      const renderChart = (rawData) => {
        container.innerHTML = '';

        const uniqueMap = new Map();
        rawData.forEach((d) => {
          const score = Number.parseFloat(d.imdb_score);
          const country = d.country_clean;
          const genre = d.genre_clean;

          if (country && genre && !Number.isNaN(score) && score > 0) {
            const key = `${d.id}_${genre}`;
            if (!uniqueMap.has(key)) {
              uniqueMap.set(key, { id: d.id, country, genre });
            }
          }
        });
        const cleanedData = Array.from(uniqueMap.values());

        const countryRollup = d3.rollup(cleanedData, (v) => v.length, (d) => d.country);
        const topCountries = Array.from(countryRollup)
          .sort((a, b) => b[1] - a[1])
          .slice(0, TOP_N_COUNTRIES)
          .map((d) => d[0]);

        const genreRollup = d3.rollup(cleanedData, (v) => v.length, (d) => d.genre);
        const topGenres = Array.from(genreRollup)
          .sort((a, b) => b[1] - a[1])
          .map((d) => d[0]);

        const filteredData = cleanedData.filter(
          (d) => topCountries.includes(d.country) && topGenres.includes(d.genre)
        );

        const genreTotals = d3.rollup(filteredData, (v) => v.length, (d) => d.genre);

        const shareData = [];
        topGenres.forEach((genre) => {
          const totalInGenre = genreTotals.get(genre) || 1;
          topCountries.forEach((country) => {
            const count = filteredData.filter((d) => d.country === country && d.genre === genre)
              .length;
            shareData.push({
              genre,
              country,
              count,
              total: totalInGenre,
              share: count / totalInGenre,
            });
          });
        });

        const margin = { top: 10, right: 10, bottom: 30, left: 14 };
        const width = 150 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const y = d3.scaleBand().domain(topCountries).range([0, height]).padding(0.2);

        const x = d3.scaleLinear().domain([0, 1]).range([0, width]);

        const containerSel = d3.select(container);
        const track = containerSel.append('div').attr('class', 'market-share-facets__track');

        const labelsCol = track.append('div').attr('class', 'market-share-facets-labels-col');
        labelsCol.append('div').attr('class', 'market-share-facets-labels-title-gap');

        const labelsRows = labelsCol
          .append('div')
          .attr('class', 'market-share-facets-labels-rows')
          .style('height', `${margin.top + height}px`);

        topCountries.forEach((country) => {
          labelsRows
            .append('div')
            .attr('class', 'market-share-facets-label-row')
            .style('top', `${margin.top + y(country) + y.bandwidth() / 2}px`)
            .text(countryDisplay(country));
        });

        topGenres.forEach((genre) => {
          const genreData = shareData.filter((d) => d.genre === genre);

          const facet = track.append('div').attr('class', 'market-share-facet');

          facet
            .append('div')
            .attr('class', 'market-share-facet__title')
            .text(genre);

          const svg = facet
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

          svg
            .append('g')
            .attr('class', 'market-share-facet__axis market-share-facet__axis--x')
            .attr('transform', `translate(0,${height})`)
            .call(
              d3
                .axisBottom(x)
                .ticks(2)
                .tickFormat(d3.format('.0%'))
                .tickSizeOuter(0)
            )
            .call((g) => g.select('.domain').attr('stroke', 'rgba(255,255,255,0.18)'))
            .call((g) => g.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.1)'))
            .call((g) =>
              g
                .selectAll('.tick text')
                .attr('fill', '#B3B3B3')
                .attr('font-size', 10)
                .attr('font-family', FONT_STACK)
            );

          const row = svg
            .selectAll('.market-share-facet__row')
            .data(genreData)
            .enter()
            .append('g')
            .attr('class', 'market-share-facet__row')
            .attr('transform', (d) => `translate(0,${y(d.country)})`);

          row
            .append('rect')
            .attr('class', 'market-share-facet__bar')
            .attr('y', 0)
            .attr('height', y.bandwidth())
            .attr('x', 0)
            .attr('width', 0)
            .attr('rx', 2)
            .attr('ry', 2)
            .transition()
            .duration(1000)
            .attr('width', (d) => x(d.share));

          row
            .append('rect')
            .attr('class', 'market-share-facet__hit')
            .attr('y', 0)
            .attr('height', y.bandwidth())
            .attr('x', 0)
            .attr('width', width)
            .attr('fill', 'transparent')
            .style('cursor', 'pointer')
            .on('mouseenter', (event, d) => {
              const name = countryDisplay(d.country);
              tooltip.innerHTML = `
                <div class="market-share-facets__tt-genre">${d.genre}</div>
                <div class="market-share-facets__tt-main">${name}: ${(d.share * 100).toFixed(1)}%</div>
                <div class="market-share-facets__tt-detail">Titles: ${d.count} / ${d.total}</div>
              `;
              tooltip.hidden = false;
              requestAnimationFrame(() => {
                tooltip.classList.add('is-visible');
                moveTip(event);
              });
            })
            .on('mousemove', (event) => {
              moveTip(event);
            })
            .on('mouseleave', () => {
              hideTip();
            });
        });

        setStatus('', false);
        container.removeAttribute('aria-hidden');
      };

      setStatus('Loading chart…', false);

      d3.csv(CSV_URL)
        .then((data) => {
          renderChart(data);
        })
        .catch(() => {
          setStatus('Could not load chart data. Check that the CSV file is available.', true);
        });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMarketShareSmallMultiples);
    } else {
      initMarketShareSmallMultiples();
    }

    /* ---------------------------------------------------------
       7. Quote Section
          a) Intersection Observer — fade-in + scale-up for the
             quote text and delayed fade-in for the attribution
          b) Subtle parallax drift on the radial glow layer
       --------------------------------------------------------- */
    const quoteSection  = document.querySelector('.quote-section');
    const quoteText     = document.querySelector('.quote-text');
    const quoteSource   = document.querySelector('.quote-source');
    const quoteBgLayer  = document.querySelector('.quote-bg-layer');

    if (quoteSection && quoteText && quoteSource) {
      const quoteObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              quoteText.classList.add('is-visible');
              quoteSource.classList.add('is-visible');
              quoteSection.querySelector('.quote-block').classList.add('is-entering');
              quoteObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.25 }
      );

      quoteObserver.observe(quoteSection);
    }

    /* Parallax: shift the glow layer very slightly as the
       section scrolls through the viewport */
    if (quoteBgLayer && quoteSection && !prefersReducedMotion) {
      const applyQuoteParallax = () => {
        const rect     = quoteSection.getBoundingClientRect();
        const vh       = window.innerHeight;
        // progress 0 (section bottom at viewport bottom) → 1 (section top at viewport top)
        const progress = 1 - Math.max(0, Math.min(1, rect.bottom / (vh + rect.height)));
        const shift    = (progress - 0.5) * 60; // ±30 px
        quoteBgLayer.style.transform = `translateY(${shift}px)`;
      };

      window.addEventListener('scroll', applyQuoteParallax, { passive: true });
      applyQuoteParallax();
    }

    /* ---------------------------------------------------------
       8. Interactive Data Explorer — radio pill toggle
          Switches between VIEW A (content-composition, default) and
          VIEW B (market-share) with a smooth fade + lift.
       --------------------------------------------------------- */
    const explorerRadios = document.querySelectorAll('input[name="explorer-view"]');
    const explorerViews  = document.querySelectorAll('.explorer-view');

    if (explorerRadios.length && explorerViews.length) {
      const switchView = (targetValue) => {
        explorerViews.forEach((view) => {
          const isTarget = view.id === `view-${targetValue}`;

          if (isTarget) {
            // Remove hidden first so the element is in layout, then
            // trigger the CSS transition on the next paint.
            view.removeAttribute('hidden');
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                view.classList.add('is-active');
                window.dispatchEvent(
                  new CustomEvent('explorer-view-active', {
                    detail: { viewId: view.id },
                  })
                );
              });
            });
          } else {
            view.classList.remove('is-active');
            // Wait for the fade-out transition before hiding from layout
            view.addEventListener('transitionend', () => {
              if (!view.classList.contains('is-active')) {
                view.setAttribute('hidden', '');
              }
            }, { once: true });
          }
        });
      };

      explorerRadios.forEach((radio) => {
        radio.addEventListener('change', () => {
          if (radio.checked) switchView(radio.value);
        });
      });

      const checkedExplorer = document.querySelector('input[name="explorer-view"]:checked');
      if (checkedExplorer) {
        switchView(checkedExplorer.value);
      }
    }

    /* ---------------------------------------------------------
       8b. Content composition — D3 multi-row horizontal bars
           (Top 5 genres per country). Staggered slide-in by
           country block when the section enters view.
       --------------------------------------------------------- */
    const initCompositionGenreChart = () => {
      if (typeof window.d3 === 'undefined') return;
      const d3 = window.d3;

      const host = document.getElementById('composition-stacked-host');
      const tipEl = document.getElementById('composition-stacked-tooltip');
      const viewEl = document.getElementById('view-content-composition');
      if (!host || !tipEl || !viewEl) return;

      const GENRE_BLOCKS = [
        {
          countryLabel: 'United States',
          genres: [
            { genre: 'Comedy', pct: 40 },
            { genre: 'Drama', pct: 38 },
            { genre: 'Documentation', pct: 22 },
            { genre: 'Action', pct: 18 },
            { genre: 'Thriller', pct: 18 },
          ],
        },
        {
          countryLabel: 'India',
          genres: [
            { genre: 'Drama', pct: 75 },
            { genre: 'Comedy', pct: 40 },
            { genre: 'Romance', pct: 32 },
            { genre: 'Action', pct: 28 },
            { genre: 'Thriller', pct: 25 },
          ],
        },
        {
          countryLabel: 'Japan',
          genres: [
            { genre: 'Animation', pct: 62 },
            { genre: 'Drama', pct: 58 },
            { genre: 'Action', pct: 55 },
            { genre: 'Fantasy', pct: 40 },
            { genre: 'Sci-Fi', pct: 38 },
          ],
        },
        {
          countryLabel: 'South Korea',
          genres: [
            { genre: 'Drama', pct: 68 },
            { genre: 'Comedy', pct: 38 },
            { genre: 'Romance', pct: 35 },
            { genre: 'Thriller', pct: 30 },
            { genre: 'Action', pct: 22 },
          ],
        },
        {
          countryLabel: 'United Kingdom',
          genres: [
            { genre: 'Drama', pct: 42 },
            { genre: 'Comedy', pct: 30 },
            { genre: 'Documentation', pct: 22 },
            { genre: 'Action', pct: 15 },
            { genre: 'Thriller', pct: 14 },
          ],
        },
        {
          countryLabel: 'France',
          genres: [
            { genre: 'Drama', pct: 58 },
            { genre: 'European', pct: 46 },
            { genre: 'Comedy', pct: 32 },
            { genre: 'Action', pct: 18 },
            { genre: 'Thriller', pct: 15 },
          ],
        },
      ];

      const GENRE_COLORS = {
        drama: '#E50914',
        comedy: '#A0CBE8',
        thriller: '#F28E2B',
        action: '#FFBE7D',
        crime: '#59A14F',
        romance: '#8CD17D',
        animation: '#B6992D',
        fantasy: '#F1CE63',
        family: '#499894',
        'sci-fi': '#86BCB6',
        documentation: '#4E79A7',
        european: '#FF9D9A',
      };

      const genreFill = (genre) => {
        const k = String(genre).trim().toLowerCase();
        return GENRE_COLORS[k] || '#B3B3B3';
      };

      /* Per-swatch contrast for bar interiors (premium dark bg). */
      const genreBarLabelFill = (genre) => {
        const k = String(genre).trim().toLowerCase();
        const lightOnBar = [
          'drama',
          'crime',
          'family',
          'documentation',
          'animation',
          'thriller',
        ];
        if (lightOnBar.includes(k)) return '#ffffff';
        return '#141414';
      };

      const BAR_H = 21;
      const BAR_GAP = 7;
      const COUNTRY_GAP = 22;
      const STAGGER_COUNTRY_MS = 210;
      const STAGGER_BAR_MS = 52;
      const BAR_DURATION_MS = 540;
      const FONT_STACK =
        '"Montserrat", "Urbanist", system-ui, -apple-system, sans-serif';

      const genreToKey = (genre) => String(genre).trim().toLowerCase();

      const COMPOSITION_DEFAULT_GENRE = 'drama';

      let compositionLockedGenre = COMPOSITION_DEFAULT_GENRE;
      let compositionHoverGenre = null;
      let compositionBarListenerAbort = null;
      let compositionGenreHintDismissed = false;

      let resizeTimer = null;
      let introPlayed = false;

      const COMPOSITION_MUTED_OPACITY = 0.15;
      const COMPOSITION_LEGEND_IDLE_OPACITY = 0.62;
      const COMPOSITION_LEGEND_HOVER_DIM_OPACITY = 0.38;

      const getCompositionChartRoot = () => document.getElementById('chart-content-composition');

      const dismissCompositionGenreHint = () => {
        if (compositionGenreHintDismissed) return;
        const hint = document.getElementById('composition-genre-hint');
        if (hint) {
          hint.classList.add('is-dismissed');
          compositionGenreHintDismissed = true;
        }
      };

      const applyCompositionGenreFocus = () => {
        const root = getCompositionChartRoot();
        if (!root) return;
        const focus = compositionLockedGenre || compositionHoverGenre;

        root.querySelectorAll('.composition-genre-bar[data-genre]').forEach((el) => {
          const k = el.getAttribute('data-genre');
          if (!k) return;
          if (focus === null) {
            el.style.opacity = String(COMPOSITION_MUTED_OPACITY);
          } else if (k === focus) {
            el.style.opacity = '1';
          } else {
            el.style.opacity = String(COMPOSITION_MUTED_OPACITY);
          }
        });

        root.querySelectorAll('.composition-legend-item--interactive[data-genre]').forEach((el) => {
          const k = el.getAttribute('data-genre');
          if (!k) return;
          el.classList.toggle('is-genre-active', Boolean(compositionLockedGenre && k === compositionLockedGenre));
          if (compositionLockedGenre) {
            if (k === compositionLockedGenre) {
              el.style.opacity = '1';
            } else {
              el.style.opacity = String(COMPOSITION_MUTED_OPACITY);
            }
          } else if (compositionHoverGenre) {
            if (k === compositionHoverGenre) {
              el.style.opacity = '1';
            } else {
              el.style.opacity = String(COMPOSITION_LEGEND_HOVER_DIM_OPACITY);
            }
          } else {
            el.style.opacity = String(COMPOSITION_LEGEND_IDLE_OPACITY);
          }
        });
      };

      const wireCompositionLegendInteractions = () => {
        const root = getCompositionChartRoot();
        if (!root || root.dataset.compositionFocusWired === '1') return;
        root.dataset.compositionFocusWired = '1';

        root.addEventListener('click', (e) => {
          if (e.target.closest('.composition-legend-item--interactive[data-genre]')) return;
          if (e.target.closest('.composition-genre-bar')) return;
          if (e.target.closest('.composition-chart__hint')) return;
          if (e.target.closest('.composition-chart-footnote')) return;
          compositionLockedGenre = COMPOSITION_DEFAULT_GENRE;
          compositionHoverGenre = null;
          applyCompositionGenreFocus();
        });

        root.querySelectorAll('.composition-legend-item--interactive[data-genre]').forEach((item) => {
          item.addEventListener('click', (e) => {
            e.stopPropagation();
            const k = item.getAttribute('data-genre');
            compositionHoverGenre = null;
            compositionLockedGenre = k || COMPOSITION_DEFAULT_GENRE;
            dismissCompositionGenreHint();
            applyCompositionGenreFocus();
          });
          item.addEventListener('mouseenter', () => {
            if (compositionLockedGenre) return;
            compositionHoverGenre = item.getAttribute('data-genre');
            applyCompositionGenreFocus();
          });
          item.addEventListener('mouseleave', () => {
            if (compositionLockedGenre) return;
            compositionHoverGenre = null;
            applyCompositionGenreFocus();
          });
        });
      };

      const wireCompositionBarsAfterRender = () => {
        if (compositionBarListenerAbort) compositionBarListenerAbort.abort();
        compositionBarListenerAbort = new AbortController();
        const { signal } = compositionBarListenerAbort;
        host.querySelectorAll('.composition-genre-bar[data-genre]').forEach((gEl) => {
          const k = gEl.getAttribute('data-genre');
          if (!k) return;
          gEl.addEventListener(
            'click',
            (e) => {
              e.stopPropagation();
              compositionHoverGenre = null;
              compositionLockedGenre = k || COMPOSITION_DEFAULT_GENRE;
              dismissCompositionGenreHint();
              applyCompositionGenreFocus();
            },
            { signal }
          );
          gEl.addEventListener(
            'mouseenter',
            () => {
              if (compositionLockedGenre) return;
              compositionHoverGenre = k;
              applyCompositionGenreFocus();
            },
            { signal }
          );
          gEl.addEventListener(
            'mouseleave',
            () => {
              hideTip();
              if (compositionLockedGenre) return;
              compositionHoverGenre = null;
              applyCompositionGenreFocus();
            },
            { signal }
          );
        });
      };

      const isCompositionActive = () =>
        viewEl.classList.contains('is-active') && !viewEl.hasAttribute('hidden');

      const hideTip = () => {
        tipEl.hidden = true;
        tipEl.classList.remove('is-visible');
      };

      const moveTip = (event) => {
        const pad = 14;
        const rect = tipEl.getBoundingClientRect();
        let x = event.clientX + pad;
        let y = event.clientY + pad;
        if (x + rect.width > window.innerWidth - 8) {
          x = event.clientX - rect.width - pad;
        }
        if (y + rect.height > window.innerHeight - 8) {
          y = event.clientY - rect.height - pad;
        }
        tipEl.style.left = `${Math.max(8, x)}px`;
        tipEl.style.top = `${Math.max(8, y)}px`;
      };

      const showTip = (event, countryName, genre, pct) => {
        tipEl.textContent = `${countryName} | ${String(genre).toUpperCase()}: ${pct}%`;
        tipEl.hidden = false;
        requestAnimationFrame(() => {
          tipEl.classList.add('is-visible');
          moveTip(event);
        });
      };

      const blockInnerHeight = (n) => n * BAR_H + Math.max(0, n - 1) * BAR_GAP;

      function render(animate) {
        const outerW = Math.max(280, Math.floor(host.getBoundingClientRect().width));
        const margin = { top: 8, right: 12, bottom: 44, left: 212 };
        const innerW = Math.max(120, outerW - margin.left - margin.right);
        const x = d3.scaleLinear().domain([0, 100]).range([0, innerW]);

        let innerH = 0;
        GENRE_BLOCKS.forEach((block, bi) => {
          innerH += blockInnerHeight(block.genres.length);
          if (bi < GENRE_BLOCKS.length - 1) innerH += COUNTRY_GAP;
        });

        const outerH = innerH + margin.top + margin.bottom;

        host.innerHTML = '';

        const svg = d3
          .select(host)
          .append('svg')
          .attr('width', '100%')
          .attr('height', null)
          .attr('viewBox', `0 0 ${outerW} ${outerH}`)
          .attr('preserveAspectRatio', 'xMinYMin meet')
          .style('background', 'transparent')
          .attr('role', 'img')
          .attr(
            'aria-label',
            'United States, India, Japan, South Korea, the United Kingdom, and France: top five genres by share of each national Netflix library.'
          );

        const plot = svg
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);

        plot
          .append('g')
          .attr('class', 'composition-axis composition-axis--x')
          .attr('transform', `translate(0,${innerH})`)
          .call(
            d3
              .axisBottom(x)
              .tickValues([0, 25, 50, 75, 100])
              .tickFormat((v) => `${v}%`)
              .tickSizeOuter(0)
          )
          .call((g) => g.select('.domain').attr('stroke', 'rgba(255,255,255,0.22)'))
          .call((g) =>
            g.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.08)')
          )
          .call((g) =>
            g
              .selectAll('.tick text')
              .attr('fill', '#B3B3B3')
              .attr('font-size', 11)
              .attr('font-weight', '700')
              .attr('font-family', FONT_STACK)
              .attr('letter-spacing', '0.12em')
          );

        let yCursor = 0;

        GENRE_BLOCKS.forEach((block, countryIdx) => {
          const bh = blockInnerHeight(block.genres.length);
          const gBlock = plot
            .append('g')
            .attr('class', 'composition-country-block')
            .attr('transform', `translate(0,${yCursor})`);

          gBlock
            .append('text')
            .attr('class', 'composition-country-label')
            .attr('x', -18)
            .attr('y', bh / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .attr('fill', '#ffffff')
            .attr('font-size', 12)
            .attr('font-weight', '800')
            .attr('font-family', FONT_STACK)
            .attr('letter-spacing', '0.02em')
            .style('text-transform', 'none')
            .text(block.countryLabel);

          block.genres.forEach((row, barIdx) => {
            const yBar = barIdx * (BAR_H + BAR_GAP);
            const barW = x(row.pct);
            const fill = genreFill(row.genre);
            const txt = genreBarLabelFill(row.genre);
            const minInBarW = 88;
            const gBar = gBlock
              .append('g')
              .attr('class', 'composition-genre-bar')
              .attr('data-genre', genreToKey(row.genre))
              .attr('transform', `translate(0,${yBar})`);

            const rect = gBar
              .append('rect')
              .attr('x', 0)
              .attr('y', 0)
              .attr('height', BAR_H)
              .attr('rx', 4)
              .attr('ry', 4)
              .attr('fill', fill)
              .attr('stroke', 'rgba(255,255,255,0.14)')
              .attr('stroke-width', 1)
              .style('cursor', 'pointer')
              .attr('width', animate ? 0 : barW)
              .on('mousemove', (e) => {
                showTip(e, block.countryLabel, row.genre, row.pct);
                moveTip(e);
              })
              .on('mouseleave', hideTip);

            const labelStr = `${String(row.genre).toUpperCase()} · ${row.pct}%`;
            const inBar = barW >= minInBarW;

            const lbl = gBar
              .append('text')
              .attr('class', 'composition-bar-label')
              .classed('composition-bar-label--outside', !inBar)
              .attr('x', inBar ? 10 : animate ? 6 : barW + 8)
              .attr('y', BAR_H / 2)
              .attr('dy', '0.35em')
              .attr('text-anchor', 'start')
              .attr('fill', inBar ? txt : '#B3B3B3')
              .attr('font-size', 11)
              .attr('font-weight', '700')
              .attr('font-family', FONT_STACK)
              .attr('letter-spacing', '0.1em')
              .style('text-transform', 'uppercase')
              .attr('pointer-events', 'none')
              .attr('opacity', animate ? 0 : 1)
              .text(labelStr);

            if (animate) {
              const delay = countryIdx * STAGGER_COUNTRY_MS + barIdx * STAGGER_BAR_MS;
              rect
                .transition()
                .delay(delay)
                .duration(BAR_DURATION_MS)
                .ease(d3.easeCubicOut)
                .attr('width', barW);

              lbl
                .transition()
                .delay(delay + (inBar ? BAR_DURATION_MS * 0.35 : BAR_DURATION_MS * 0.52))
                .duration(360)
                .ease(d3.easeCubicOut)
                .attr('opacity', 1)
                .attr('x', inBar ? 10 : barW + 8);
            }
          });

          yCursor += bh;
          if (countryIdx < GENRE_BLOCKS.length - 1) yCursor += COUNTRY_GAP;
        });

        hideTip();
        wireCompositionBarsAfterRender();
        applyCompositionGenreFocus();
      }

      const debouncedRenderStatic = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          if (host.getBoundingClientRect().width > 0) render(false);
        }, 100);
      };

      const attemptIntro = () => {
        if (introPlayed || !isCompositionActive()) return;
        const r = host.getBoundingClientRect();
        if (r.width < 48) return;
        const vh = window.innerHeight || 800;
        const inView = r.bottom > vh * 0.05 && r.top < vh * 0.95;
        if (!inView) return;
        introPlayed = true;
        render(true);
      };

      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(() => {
          if (introPlayed) debouncedRenderStatic();
        }).observe(host);
      } else {
        window.addEventListener(
          'resize',
          () => {
            if (introPlayed) debouncedRenderStatic();
          },
          { passive: true }
        );
      }

      const introIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
              attemptIntro();
            }
          });
        },
        { threshold: [0, 0.1, 0.2], rootMargin: '0px 0px -6% 0px' }
      );
      introIo.observe(host);

      window.addEventListener('explorer-view-active', (e) => {
        if (e.detail && e.detail.viewId === 'view-content-composition') {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(attemptIntro);
          });
        }
      });

      dismissCompositionGenreHint();
      wireCompositionLegendInteractions();
      applyCompositionGenreFocus();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initCompositionGenreChart);
    } else {
      initCompositionGenreChart();
    }

    /* ---------------------------------------------------------
       9. Regional Genre Specialization — custom HTML/CSS
          heatmap permanently displayed after the tarot game.
          Builds the table from the score matrix below, assigns
          each cell a tiered Netflix-red rgba() background, and
          marks the top country for each genre with a trophy.
       --------------------------------------------------------- */
    /* Genre columns: short `display` keeps the grid uniform/compact while
       `full` is preserved for tooltips, aria-labels, and screen readers. */
    const heatmapGenres = [
      { display: 'Action',    full: 'Action' },
      { display: 'Animation', full: 'Animation' },
      { display: 'Comedy',    full: 'Comedy' },
      { display: 'Crime',     full: 'Crime' },
      { display: 'Docs',      full: 'Documentation' },
      { display: 'Drama',     full: 'Drama' },
      { display: 'Reality',   full: 'Reality' },
      { display: 'Romance',   full: 'Romance' },
      { display: 'Sci-Fi',    full: 'Sci-Fi' },
      { display: 'Thriller',  full: 'Thriller' }
    ];

    /* Region rows. `display` is the visible row label, `name` is the
       accessible/full country name kept for aria + native tooltips.
       `null` in scores = no data (matches the empty BR/Action cell). */
    const heatmapRegions = [
      { code: 'BR', display: 'Brazil', name: 'Brazil',         scores: [null,  6.450, 5.450, 6.200, 7.000, 6.600, 6.100, 6.200, 6.900, 6.300] },
      { code: 'CA', display: 'Canada', name: 'Canada',         scores: [5.800, 5.500, 6.600, 6.450, 7.400, 6.600, 6.850, 5.200, 6.600, 5.700] },
      { code: 'ES', display: 'Spain',  name: 'Spain',          scores: [5.700, 7.300, 5.800, 6.700, 7.250, 6.650, 4.900, 5.800, 6.250, 6.100] },
      { code: 'FR', display: 'France', name: 'France',         scores: [6.000, 7.100, 6.300, 7.200, 6.900, 6.500, 6.850, 5.800, 6.450, 6.200] },
      { code: 'GB', display: 'UK',     name: 'United Kingdom', scores: [6.100, 7.200, 7.100, 6.750, 7.200, 7.000, 7.000, 6.000, 5.400, 6.600] },
      { code: 'IN', display: 'India',  name: 'India',          scores: [6.300, 7.300, 6.300, 7.200, 7.300, 7.000, 4.500, 6.550, 6.450, 6.300] },
      { code: 'JP', display: 'Japan',  name: 'Japan',          scores: [7.050, 7.200, 7.200, 7.000, 7.650, 6.950, 7.250, 6.600, 7.300, 6.500] },
      { code: 'KR', display: 'Korea',  name: 'South Korea',    scores: [6.850, 6.200, 7.200, 7.800, 6.500, 7.600, 7.300, 8.100, 7.100, 6.700] },
      { code: 'MX', display: 'Mexico', name: 'Mexico',         scores: [6.400, 7.500, 6.200, 7.450, 7.200, 6.400, 5.800, 5.850, 6.700, 7.000] },
      { code: 'US', display: 'USA',    name: 'United States',  scores: [6.100, 6.400, 6.500, 7.000, 7.200, 6.800, 6.400, 6.000, 6.750, 6.100] }
    ];

    /* Score → rgba() background. Discrete tiers (per design brief):
         - score > 7.5      → 100% opacity (solid Netflix red)
         - 7.0 ≤ score ≤ 7.5 → 80% opacity
         - 6.0 ≤ score < 7.0 → 50% opacity
         - score < 6.0      → 20% opacity (low / dark gray feel)
    */
    const NETFLIX_RED_RGB = '229, 9, 20';

    const cellStyleForScore = (score) => {
      if (score == null) return { bg: '', cls: 'is-empty' };

      let opacity;
      let cls = '';

      if (score > 7.5) {
        opacity = 1.00;
        cls = 'is-top';
      } else if (score >= 7.0) {
        opacity = 0.80;
        cls = 'is-high';
      } else if (score >= 6.0) {
        opacity = 0.50;
        cls = 'is-mid';
      } else {
        opacity = 0.20;
        cls = 'is-low';
      }

      return {
        bg: `rgba(${NETFLIX_RED_RGB}, ${opacity.toFixed(2)})`,
        cls
      };
    };

    /* For each genre column, every region tied for the highest score gets the 🏆
       badge (e.g. Comedy: Japan and Korea both at 7.200). */
    const bestRowsPerGenre = heatmapGenres.map((_, colIdx) => {
      let bestScore = -Infinity;
      heatmapRegions.forEach((region) => {
        const s = region.scores[colIdx];
        if (s != null && s > bestScore) bestScore = s;
      });
      const rows = [];
      heatmapRegions.forEach((region, rowIdx) => {
        const s = region.scores[colIdx];
        if (s != null && s === bestScore) rows.push(rowIdx);
      });
      return rows;
    });

    const buildHeatmap = () => {
      const table = document.getElementById('heatmap-table');
      if (!table) return;

      const thead = table.tHead || table.createTHead();
      const tbody = table.tBodies[0] || table.appendChild(document.createElement('tbody'));
      thead.innerHTML = '';
      tbody.innerHTML = '';

      // Header row: corner cell + genre columns
      const headerRow = document.createElement('tr');
      const corner = document.createElement('th');
      corner.scope = 'col';
      corner.className = 'heatmap-corner';
      corner.textContent = 'Region';
      headerRow.appendChild(corner);

      heatmapGenres.forEach((genre, colIdx) => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.dataset.col = String(colIdx);
        th.textContent = genre.display;
        // Full name for screen readers + native tooltip
        if (genre.full !== genre.display) th.title = genre.full;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);

      // Body rows
      heatmapRegions.forEach((region, rowIdx) => {
        const tr = document.createElement('tr');

        const rowHeader = document.createElement('th');
        rowHeader.scope = 'row';
        rowHeader.dataset.row = String(rowIdx);
        // `region.name` is the full official country name kept for aria/title.
        // `region.display` is the visible label (e.g. "UK", "Korea", "USA").
        rowHeader.title = region.name;
        rowHeader.innerHTML =
          `<span class="heatmap-row-flag" aria-hidden="true"></span>${region.display}`;
        tr.appendChild(rowHeader);

        region.scores.forEach((score, colIdx) => {
          const td = document.createElement('td');
          td.className = 'heatmap-cell';
          td.dataset.row = String(rowIdx);
          td.dataset.col = String(colIdx);

          const { bg, cls } = cellStyleForScore(score);
          if (cls) td.classList.add(cls);
          if (bg) td.style.backgroundColor = bg;

          const isBestInGenre =
            score != null && bestRowsPerGenre[colIdx].includes(rowIdx);

          const genreFull = heatmapGenres[colIdx].full;

          if (score == null) {
            td.textContent = '—';
            td.setAttribute(
              'aria-label',
              `${region.name}, ${genreFull}: no data`
            );
            td.title = `${region.name} · ${genreFull} — no data`;
          } else {
            const text = score.toFixed(3);
            const trophyHTML = isBestInGenre
              ? `<span class="heatmap-trophy" aria-hidden="true" title="Best in genre">🏆</span>`
              : '';
            td.innerHTML = `<span class="heatmap-cell-value">${text}${trophyHTML}</span>`;

            const trophyAria = isBestInGenre
              ? `, top-rated for this genre`
              : '';
            td.setAttribute(
              'aria-label',
              `${region.name}, ${genreFull}: median IMDb score ${text}${trophyAria}`
            );
            td.title = `${region.name} · ${genreFull} — ${text}${
              isBestInGenre ? '  · Best in genre' : ''
            }`;

            if (isBestInGenre) td.classList.add('is-best-in-genre');
          }
          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });

      // Cross-hair hover: highlight the current row + column headers.
      const setActive = (rowIdx, colIdx, on) => {
        const rowTh = tbody.querySelector(`th[data-row="${rowIdx}"]`);
        const colTh = thead.querySelector(`th[data-col="${colIdx}"]`);
        if (rowTh) rowTh.classList.toggle('is-active', on);
        if (colTh) colTh.classList.toggle('is-active', on);
      };

      tbody.addEventListener('mouseover', (e) => {
        const cell = e.target.closest('.heatmap-cell');
        if (!cell) return;
        setActive(cell.dataset.row, cell.dataset.col, true);
      });
      tbody.addEventListener('mouseout', (e) => {
        const cell = e.target.closest('.heatmap-cell');
        if (!cell) return;
        setActive(cell.dataset.row, cell.dataset.col, false);
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', buildHeatmap);
    } else {
      buildHeatmap();
    }

    /* ---------------------------------------------------------
       10. Tarot Flip-Card Grid — selectively ported from the
           standalone Flip-Card project. Renders cards into
           #cardGrid (inside #tarot-game-container) and runs an
           auto-fit pass so genre titles never wrap.
           Source data preserved: genre, country, flag, score.
       --------------------------------------------------------- */
    const genreData = [
      { genre: 'Action', country: 'Japan', flag: '🇯🇵', score: 7.05 },
      { genre: 'Animation', country: 'Mexico', flag: '🇲🇽', score: 7.5 },
      { genre: 'Comedy', country: 'South Korea', flag: '🇰🇷', score: 7.2 },
      { genre: 'Crime', country: 'South Korea', flag: '🇰🇷', score: 7.8 },
      { genre: 'Documentation', country: 'Japan', flag: '🇯🇵', score: 7.65 },
      { genre: 'Drama', country: 'South Korea', flag: '🇰🇷', score: 7.6 },
      { genre: 'Reality', country: 'South Korea', flag: '🇰🇷', score: 7.3 },
      { genre: 'Romance', country: 'South Korea', flag: '🇰🇷', score: 8.1 },
      { genre: 'Sci-fi', country: 'Japan', flag: '🇯🇵', score: 7.3 },
      { genre: 'Thriller', country: 'Mexico', flag: '🇲🇽', score: 7.0 },
    ];

    const toggleFlip = (card) => {
      const flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', String(flipped));
    };

    const createCard = (item) => {
      const card = document.createElement('button');
      card.className = 'flip-card';
      card.type = 'button';
      card.setAttribute('aria-pressed', 'false');
      card.setAttribute(
        'aria-label',
        `${item.genre}. Click to reveal top country: ${item.country}, median IMDb score ${item.score.toFixed(2)}.`
      );

      const inner = document.createElement('div');
      inner.className = 'flip-card-inner';

      const front = document.createElement('div');
      front.className = 'flip-card-face flip-card-front';
      front.innerHTML = `
        <h2 class="flip-card-genre">${item.genre}</h2>
        <span class="flip-card-hint">Click to reveal</span>
      `;

      const back = document.createElement('div');
      back.className = 'flip-card-face flip-card-back';
      back.innerHTML = `
        <div class="flip-card-back-header">
          <span class="flip-card-back-meta-line">${item.country} • ${item.genre}</span>
        </div>
        <div class="flip-card-back-flag-wrap">
          <span class="flip-card-back-flag" aria-hidden="true">${item.flag}</span>
        </div>
        <div class="flip-card-back-score">
          <span class="flip-card-score-label">Median IMDb score</span>
          <span class="flip-card-score">${item.score.toFixed(2)}</span>
        </div>
      `;

      inner.appendChild(front);
      inner.appendChild(back);
      card.appendChild(inner);

      card.addEventListener('click', () => toggleFlip(card));
      return card;
    };

    const renderCards = (data) => {
      const grid = document.getElementById('cardGrid');
      if (!grid) return;
      const fragment = document.createDocumentFragment();
      data.forEach((item) => fragment.appendChild(createCard(item)));
      grid.innerHTML = '';
      grid.appendChild(fragment);
    };

    /* Auto-fit: shrink the genre <h2> until it fits on one line.
       We measure against the parent's available width because the
       h2 lives in a centered flex column and shrinks to its content. */
    const fitGenreText = (el, { minFontSize = 10, step = 0.5 } = {}) => {
      if (!el || !el.parentElement) return;
      el.style.fontSize = '';
      el.style.whiteSpace = 'nowrap';

      const parent = el.parentElement;
      const parentStyle = window.getComputedStyle(parent);
      const availableWidth =
        parent.clientWidth -
        parseFloat(parentStyle.paddingLeft) -
        parseFloat(parentStyle.paddingRight);

      if (availableWidth <= 0) return;
      let size = parseFloat(window.getComputedStyle(el).fontSize);
      while (el.scrollWidth > availableWidth && size > minFontSize) {
        size -= step;
        el.style.fontSize = `${size}px`;
      }
    };

    const fitAllGenres = () => {
      document
        .querySelectorAll('.flip-card-genre')
        .forEach((el) => fitGenreText(el));
    };

    const watchCardResizes = () => {
      if (typeof ResizeObserver === 'undefined') {
        let t;
        window.addEventListener('resize', () => {
          clearTimeout(t);
          t = setTimeout(fitAllGenres, 120);
        });
        return;
      }
      const ro = new ResizeObserver(() => {
        requestAnimationFrame(fitAllGenres);
      });
      document.querySelectorAll('.flip-card').forEach((card) => ro.observe(card));
    };

    const initFlipCards = () => {
      if (!document.getElementById('cardGrid')) return;
      renderCards(genreData);
      fitAllGenres();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(fitAllGenres);
      }
      watchCardResizes();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initFlipCards);
    } else {
      initFlipCards();
    }

    /* ---------------------------------------------------------
       6b. Quiz reveal #1 — Movie vs Show box plot (D3)
       --------------------------------------------------------- */
    const initRevealBoxplot = () => {
      if (typeof window.d3 === 'undefined') return;

      const d3 = window.d3;
      const reveal = document.getElementById('reveal');
      const container = document.getElementById('boxplot-container');
      const root = document.getElementById('boxplot');
      if (!reveal || !container || !root) return;

      const tooltip = d3.select('#boxplot-tooltip');
      const csvUrl = 'netflix_cleaned_categorized.csv';
      const margin = { top: 20, right: 28, bottom: 52, left: 58 };
      const typesOrder = ['MOVIE', 'SHOW'];

      let boxStats = null;
      let resizeTimer = null;
      let started = false;

      const processRaw = (rawData) => {
        const uniqueMap = new Map();
        rawData.forEach((d) => {
          const score = +d.imdb_score;
          const typ = String(d.type || '').toUpperCase();
          if (!uniqueMap.has(d.id) && !Number.isNaN(score) && score > 0 && typ) {
            uniqueMap.set(d.id, { type: typ, imdb_score: score });
          }
        });
        const cleaned = Array.from(uniqueMap.values());
        const grouped = d3.group(cleaned, (v) => v.type);
        return typesOrder
          .filter((t) => grouped.has(t))
          .map((type) => {
            const vals = grouped.get(type);
            const scores = vals.map((v) => v.imdb_score).sort(d3.ascending);
            const q1 = d3.quantile(scores, 0.25);
            const median = d3.quantile(scores, 0.5);
            const q3 = d3.quantile(scores, 0.75);
            return {
              type,
              q1: q1 ?? scores[0],
              median: median ?? scores[0],
              q3: q3 ?? scores[scores.length - 1],
              min: scores[0],
              max: scores[scores.length - 1],
              count: vals.length,
            };
          });
      };

      const positionTooltip = (event) => {
        const px = event.clientX + 14;
        const py = Math.max(12, event.clientY - 10);
        tooltip.style('left', `${px}px`).style('top', `${py}px`);
      };

      const render = (animate) => {
        if (!boxStats || !boxStats.length) return;

        const outerW = Math.max(280, Math.floor(container.getBoundingClientRect().width));
        const outerH = Math.round(Math.min(480, Math.max(300, outerW * 0.52)));

        const innerW = Math.max(100, outerW - margin.left - margin.right);
        const innerH = Math.max(160, outerH - margin.top - margin.bottom);

        root.innerHTML = '';

        const svg = d3
          .select(root)
          .append('svg')
          .attr('width', '100%')
          .attr('height', null)
          .attr('preserveAspectRatio', 'xMidYMin meet')
          .attr('viewBox', `0 0 ${outerW} ${outerH}`)
          .style('background', 'transparent');

        if (animate) svg.style('opacity', 0);

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand().domain(boxStats.map((d) => d.type)).range([0, innerW]).padding(0.6);
        const y = d3.scaleLinear().domain([0, 10]).range([innerH, 0]);

        g.append('g')
          .attr('transform', `translate(0,${innerH})`)
          .attr('class', 'boxplot-axis axis')
          .call(d3.axisBottom(x));

        g.append('g').attr('class', 'boxplot-axis axis').call(d3.axisLeft(y).ticks(5));

        const groups = g.selectAll('.boxplot-group').data(boxStats).enter().append('g');

        groups
          .append('line')
          .attr('class', 'boxplot-whisker-line')
          .attr('x1', (d) => x(d.type) + x.bandwidth() / 2)
          .attr('x2', (d) => x(d.type) + x.bandwidth() / 2)
          .attr('y1', (d) => y(d.min))
          .attr('y2', (d) => y(d.max));

        groups
          .append('line')
          .attr('class', 'boxplot-whisker-cap')
          .attr('x1', (d) => x(d.type) + x.bandwidth() * 0.3)
          .attr('x2', (d) => x(d.type) + x.bandwidth() * 0.7)
          .attr('y1', (d) => y(d.max))
          .attr('y2', (d) => y(d.max));

        groups
          .append('line')
          .attr('class', 'boxplot-whisker-cap')
          .attr('x1', (d) => x(d.type) + x.bandwidth() * 0.3)
          .attr('x2', (d) => x(d.type) + x.bandwidth() * 0.7)
          .attr('y1', (d) => y(d.min))
          .attr('y2', (d) => y(d.min));

        const tipHtml = (d) =>
          `<div class="boxplot-tooltip-header">${d.type} (N=${d.count})</div>` +
          `<div class="boxplot-tooltip-row"><span class="boxplot-tooltip-label">Max:</span><span class="boxplot-tooltip-value">${d.max.toFixed(1)}</span></div>` +
          `<div class="boxplot-tooltip-row"><span class="boxplot-tooltip-label">Q3 (75%):</span><span class="boxplot-tooltip-value">${d.q3.toFixed(1)}</span></div>` +
          `<div class="boxplot-tooltip-row boxplot-tooltip-row--median"><span class="boxplot-tooltip-label">Median:</span><span class="boxplot-tooltip-value">${d.median.toFixed(1)}</span></div>` +
          `<div class="boxplot-tooltip-row"><span class="boxplot-tooltip-label">Q1 (25%):</span><span class="boxplot-tooltip-value">${d.q1.toFixed(1)}</span></div>` +
          `<div class="boxplot-tooltip-row"><span class="boxplot-tooltip-label">Min:</span><span class="boxplot-tooltip-value">${d.min.toFixed(1)}</span></div>`;

        groups
          .append('rect')
          .attr('class', 'boxplot-box')
          .attr('x', (d) => x(d.type))
          .attr('y', (d) => y(d.q3))
          .attr('width', x.bandwidth())
          .attr('height', (d) => Math.max(1, y(d.q1) - y(d.q3)))
          .on('mouseover', function (event, d) {
            d3.select(this).attr('fill-opacity', 1);
            tooltip.style('display', 'block').html(tipHtml(d));
            positionTooltip(event);
          })
          .on('mousemove', (event) => positionTooltip(event))
          .on('mouseleave', function () {
            d3.select(this).attr('fill-opacity', 0.8);
            tooltip.style('display', 'none');
          });

        groups
          .append('line')
          .attr('class', 'boxplot-median-line')
          .attr('x1', (d) => x(d.type))
          .attr('x2', (d) => x(d.type) + x.bandwidth())
          .attr('y1', (d) => y(d.median))
          .attr('y2', (d) => y(d.median));

        if (animate) {
          svg.transition().duration(700).ease(d3.easeCubicOut).style('opacity', 1);
        } else {
          svg.style('opacity', 1);
        }
      };

      const debouncedRender = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => render(false), 120);
      };

      const boot = () => {
        if (started) return;
        started = true;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            d3.csv(csvUrl)
              .then((raw) => {
                boxStats = processRaw(raw);
                if (!boxStats.length) {
                  root.innerHTML =
                    '<p class="boxplot-error">No movie/show score data found. Check CSV <code>type</code> values.</p>';
                  return;
                }
                render(true);
                if (typeof ResizeObserver !== 'undefined') {
                  const ro = new ResizeObserver(() => debouncedRender());
                  ro.observe(container);
                }
                window.addEventListener('resize', debouncedRender, { passive: true });
              })
              .catch(() => {
                root.innerHTML =
                  '<p class="boxplot-error">Chart data unavailable. Add <code>netflix_cleaned_categorized.csv</code> next to this page.</p>';
              });
          })
        );
      };

      const mo = new MutationObserver(() => {
        if (reveal.classList.contains('is-visible')) {
          mo.disconnect();
          boot();
        }
      });
      mo.observe(reveal, { attributes: true, attributeFilter: ['class'] });
      if (reveal.classList.contains('is-visible')) {
        mo.disconnect();
        boot();
      }
    };

    /* ---------------------------------------------------------
       6b-bis. Quiz reveal #1 — US vs Non-US box plots (D3)
       --------------------------------------------------------- */
    const initRevealRegionalBoxplots = () => {
      if (typeof window.d3 === 'undefined') return;

      const d3 = window.d3;
      const reveal = document.getElementById('reveal');
      const stack = document.getElementById('boxplot-us-non-us');
      const rootUs = document.getElementById('boxplot-us-region');
      const rootIntl = document.getElementById('boxplot-intl-region');
      if (!reveal || !stack || !rootUs || !rootIntl) return;

      const regionalTooltip = d3.select('#boxplot-regional-tooltip');
      const csvUrl = 'netflix_cleaned_categorized.csv';
      const margin = { top: 20, right: 28, bottom: 52, left: 58 };
      const typesOrder = ['MOVIE', 'SHOW'];

      let statsUs = null;
      let statsIntl = null;
      let resizeTimer = null;
      let started = false;

      const buildUniqueRegionalMaps = (rawData) => {
        const uniqueMapUs = new Map();
        const uniqueMapIntl = new Map();
        rawData.forEach((d) => {
          const score = +d.imdb_score;
          const typ = String(d.type || '').toUpperCase();
          const country = d.country_clean;
          if (!Number.isNaN(score) && score > 0 && typ) {
            if (country === 'US') {
              if (!uniqueMapUs.has(d.id)) uniqueMapUs.set(d.id, { type: typ, imdb_score: score });
            } else if (!uniqueMapIntl.has(d.id)) {
              uniqueMapIntl.set(d.id, { type: typ, imdb_score: score });
            }
          }
        });
        return { uniqueMapUs, uniqueMapIntl };
      };

      const statsFromMap = (uniqueMap) => {
        const cleaned = Array.from(uniqueMap.values());
        const grouped = d3.group(cleaned, (v) => v.type);
        return typesOrder
          .filter((t) => grouped.has(t))
          .map((type) => {
            const vals = grouped.get(type);
            const scores = vals.map((v) => v.imdb_score).sort(d3.ascending);
            const q1 = d3.quantile(scores, 0.25);
            const median = d3.quantile(scores, 0.5);
            const q3 = d3.quantile(scores, 0.75);
            return {
              type,
              q1: q1 ?? scores[0],
              median: median ?? scores[0],
              q3: q3 ?? scores[scores.length - 1],
              min: scores[0],
              max: scores[scores.length - 1],
              count: vals.length,
            };
          });
      };

      const positionRegionalTooltip = (event) => {
        const px = event.clientX + 14;
        const py = Math.max(12, event.clientY - 10);
        regionalTooltip.style('left', `${px}px`).style('top', `${py}px`);
      };

      const tipHtmlRegional = (d) =>
        `<div class="boxplot-tooltip-header">${d.type} (N=${d.count})</div>` +
        `<div class="boxplot-tooltip-row"><span class="boxplot-tooltip-label">Max:</span><span class="boxplot-tooltip-value">${d.max.toFixed(1)}</span></div>` +
        `<div class="boxplot-tooltip-row"><span class="boxplot-tooltip-label">Q3 (75%):</span><span class="boxplot-tooltip-value">${d.q3.toFixed(1)}</span></div>` +
        `<div class="boxplot-tooltip-row boxplot-tooltip-row--median"><span class="boxplot-tooltip-label">Median:</span><span class="boxplot-tooltip-value">${d.median.toFixed(1)}</span></div>` +
        `<div class="boxplot-tooltip-row"><span class="boxplot-tooltip-label">Q1 (25%):</span><span class="boxplot-tooltip-value">${d.q1.toFixed(1)}</span></div>` +
        `<div class="boxplot-tooltip-row"><span class="boxplot-tooltip-label">Min:</span><span class="boxplot-tooltip-value">${d.min.toFixed(1)}</span></div>`;

      const renderRegionalPanel = (rootEl, panelStats, animate) => {
        if (!panelStats || !panelStats.length) {
          rootEl.innerHTML =
            '<p class="boxplot-error">No score data for this region.</p>';
          return;
        }

        const panelChart = rootEl.closest('.boxplot-regional-panel-chart');
        const outerW = Math.max(
          160,
          Math.floor((panelChart && panelChart.getBoundingClientRect().width) || rootEl.getBoundingClientRect().width)
        );
        const outerH = Math.round(Math.min(480, Math.max(300, outerW * 0.52)));

        const innerW = Math.max(80, outerW - margin.left - margin.right);
        const innerH = Math.max(160, outerH - margin.top - margin.bottom);

        rootEl.innerHTML = '';

        const svgRegional = d3
          .select(rootEl)
          .append('svg')
          .attr('width', '100%')
          .attr('height', null)
          .attr('preserveAspectRatio', 'xMidYMin meet')
          .attr('viewBox', `0 0 ${outerW} ${outerH}`)
          .style('background', 'transparent');

        if (animate) svgRegional.style('opacity', 0);

        const gRegional = svgRegional.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const xRegional = d3
          .scaleBand()
          .domain(panelStats.map((d) => d.type))
          .range([0, innerW])
          .padding(0.6);
        const yRegional = d3.scaleLinear().domain([0, 10]).range([innerH, 0]);

        gRegional
          .append('g')
          .attr('transform', `translate(0,${innerH})`)
          .attr('class', 'boxplot-axis axis')
          .call(d3.axisBottom(xRegional));

        gRegional.append('g').attr('class', 'boxplot-axis axis').call(d3.axisLeft(yRegional).ticks(5));

        const groupsRegional = gRegional.selectAll('.boxplot-group-regional').data(panelStats).enter().append('g');

        groupsRegional
          .append('line')
          .attr('class', 'boxplot-whisker-line')
          .attr('x1', (d) => xRegional(d.type) + xRegional.bandwidth() / 2)
          .attr('x2', (d) => xRegional(d.type) + xRegional.bandwidth() / 2)
          .attr('y1', (d) => yRegional(d.min))
          .attr('y2', (d) => yRegional(d.max));

        groupsRegional
          .append('line')
          .attr('class', 'boxplot-whisker-cap')
          .attr('x1', (d) => xRegional(d.type) + xRegional.bandwidth() * 0.3)
          .attr('x2', (d) => xRegional(d.type) + xRegional.bandwidth() * 0.7)
          .attr('y1', (d) => yRegional(d.max))
          .attr('y2', (d) => yRegional(d.max));

        groupsRegional
          .append('line')
          .attr('class', 'boxplot-whisker-cap')
          .attr('x1', (d) => xRegional(d.type) + xRegional.bandwidth() * 0.3)
          .attr('x2', (d) => xRegional(d.type) + xRegional.bandwidth() * 0.7)
          .attr('y1', (d) => yRegional(d.min))
          .attr('y2', (d) => yRegional(d.min));

        groupsRegional
          .append('rect')
          .attr('class', (d) =>
            d.type === 'MOVIE' ? 'boxplot-box boxplot-box--movie' : 'boxplot-box boxplot-box--show'
          )
          .attr('x', (d) => xRegional(d.type))
          .attr('y', (d) => yRegional(d.q3))
          .attr('width', xRegional.bandwidth())
          .attr('height', (d) => Math.max(1, yRegional(d.q1) - yRegional(d.q3)))
          .on('mouseover', function (event, d) {
            if (d.type === 'MOVIE') d3.select(this).attr('fill-opacity', 1);
            else d3.select(this).style('filter', 'brightness(1.18)');
            regionalTooltip.style('display', 'block').html(tipHtmlRegional(d));
            positionRegionalTooltip(event);
          })
          .on('mousemove', (event) => positionRegionalTooltip(event))
          .on('mouseleave', function (event, d) {
            if (d.type === 'MOVIE') d3.select(this).attr('fill-opacity', 0.8);
            else d3.select(this).style('filter', null);
            regionalTooltip.style('display', 'none');
          });

        groupsRegional
          .append('line')
          .attr('class', 'boxplot-median-line')
          .attr('x1', (d) => xRegional(d.type))
          .attr('x2', (d) => xRegional(d.type) + xRegional.bandwidth())
          .attr('y1', (d) => yRegional(d.median))
          .attr('y2', (d) => yRegional(d.median));

        if (animate) {
          svgRegional.transition().duration(700).ease(d3.easeCubicOut).style('opacity', 1);
        } else {
          svgRegional.style('opacity', 1);
        }
      };

      const renderRegionalBoth = (animate) => {
        renderRegionalPanel(rootUs, statsUs, animate);
        renderRegionalPanel(rootIntl, statsIntl, animate);
      };

      const debouncedRegionalRender = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => renderRegionalBoth(false), 120);
      };

      const bootRegional = () => {
        if (started) return;
        started = true;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            d3.csv(csvUrl)
              .then((raw) => {
                const { uniqueMapUs, uniqueMapIntl } = buildUniqueRegionalMaps(raw);
                statsUs = statsFromMap(uniqueMapUs);
                statsIntl = statsFromMap(uniqueMapIntl);
                if (!statsUs.length && !statsIntl.length) {
                  const contentEl = document.getElementById('boxplot-regional-content');
                  if (contentEl) {
                    contentEl.innerHTML =
                      '<p class="boxplot-error">No regional score data found. Check CSV <code>country_clean</code> / <code>type</code> values.</p>';
                  }
                  return;
                }
                renderRegionalBoth(true);
                if (typeof ResizeObserver !== 'undefined') {
                  const ro = new ResizeObserver(() => debouncedRegionalRender());
                  ro.observe(stack);
                }
                window.addEventListener('resize', debouncedRegionalRender, { passive: true });
              })
              .catch(() => {
                const contentEl = document.getElementById('boxplot-regional-content');
                if (contentEl) {
                  contentEl.innerHTML =
                    '<p class="boxplot-error">Chart data unavailable. Add <code>netflix_cleaned_categorized.csv</code> next to this page.</p>';
                }
              });
          })
        );
      };

      const moRegional = new MutationObserver(() => {
        if (reveal.classList.contains('is-visible')) {
          moRegional.disconnect();
          bootRegional();
        }
      });
      moRegional.observe(reveal, { attributes: true, attributeFilter: ['class'] });
      if (reveal.classList.contains('is-visible')) {
        moRegional.disconnect();
        bootRegional();
      }
    };

    /* ---------------------------------------------------------
       6c. Quiz reveal #2 — qualified volume stacked bars (US vs International)
       --------------------------------------------------------- */
    const initReveal2VolumeBar = () => {
      if (typeof window.d3 === 'undefined') return;

      const d3 = window.d3;
      const reveal = document.getElementById('reveal-2');
      const root = document.getElementById('volume-bar-root');
      if (!reveal || !root) return;

      const csvUrl = 'netflix_cleaned_categorized.csv';
      const BAR_DURATION_MS = 1200;
      const SEGMENT_LABEL_DELAY_MS = 800;
      const SEGMENT_LABEL_FADE_MS = 600;
      const LAYOUT_SETTLE_MS = 50;
      const regions = ['US', 'International'];

      let barData = null;
      let dataPromise = null;
      let resizeTimer = null;
      let resizeWired = false;
      let introHasRun = false;
      let pendingIntroTimer = null;

      const processRaw = (rawData) => {
        const uniqueMap = new Map();
        rawData.forEach((d) => {
          const score = +d.imdb_score;
          if (!uniqueMap.has(d.id) && !Number.isNaN(score) && score > 0) {
            const region = String(d.country_clean || '').trim() === 'US' ? 'US' : 'International';
            uniqueMap.set(d.id, {
              type: String(d.type || '').toUpperCase(),
              region,
            });
          }
        });
        const cleanedArray = Array.from(uniqueMap.values());
        const counts = d3.rollup(
          cleanedArray,
          (v) => v.length,
          (row) => row.type,
          (row) => row.region
        );
        const types = Array.from(counts.keys());
        return types
          .map((type) => {
            const row = { type, total: 0 };
            regions.forEach((region) => {
              const count = counts.get(type)?.get(region) || 0;
              row[region] = count;
              row.total += count;
            });
            return row;
          })
          .sort((a, b) => b.total - a.total);
      };

      const ensureData = () => {
        if (barData) return Promise.resolve(barData);
        if (!dataPromise) {
          dataPromise = d3
            .csv(csvUrl)
            .then((raw) => {
              barData = processRaw(raw);
              return barData;
            })
            .catch(() => {
              barData = null;
              return null;
            });
        }
        return dataPromise;
      };

      const bindResizeOnce = () => {
        if (resizeWired) return;
        resizeWired = true;
        const debouncedRender = () => {
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(() => {
            if (barData && barData.length) render(false);
          }, 120);
        };
        if (typeof ResizeObserver !== 'undefined') {
          const ro = new ResizeObserver(() => debouncedRender());
          ro.observe(root);
        }
        window.addEventListener('resize', debouncedRender, { passive: true });
      };

      /**
       * Horizontal stacked bars by format (MOVIE / SHOW), segments = US vs International.
       * animate: grow segment widths; segment + total labels fade in after delay.
       */
      function render(animate) {
        if (!barData || !barData.length) return;

        const outerW = Math.max(280, Math.floor(root.getBoundingClientRect().width));
        const maxTotal = d3.max(barData, (d) => d.total) || 0;
        const digitRoom = String(Math.round(maxTotal)).length * 9 + 40;

        const margin = {
          top: 10,
          right: Math.max(100, digitRoom),
          bottom: 20,
          left: Math.max(100, Math.min(148, Math.round(outerW * 0.22))),
        };

        const innerW = Math.max(80, outerW - margin.left - margin.right);
        const innerH = Math.max(128, barData.length * 52 + 28);

        const outerH = innerH + margin.top + margin.bottom;

        root.innerHTML = '';

        const svg = d3
          .select(root)
          .append('svg')
          .attr('width', '100%')
          .attr('height', null)
          .attr('preserveAspectRatio', 'xMidYMin meet')
          .attr('viewBox', `0 0 ${outerW} ${outerH}`)
          .style('background', 'transparent');

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const y = d3
          .scaleBand()
          .domain(barData.map((d) => d.type))
          .range([0, innerH])
          .padding(0.4);

        const x = d3.scaleLinear().domain([0, maxTotal]).range([0, innerW]);

        const color = d3.scaleOrdinal().domain(regions).range(['#E50914', '#555555']);

        const stack = d3.stack().keys(regions);
        const series = stack(barData);

        g.append('g').attr('class', 'volume-bar-axis axis').call(d3.axisLeft(y));

        const layerSel = g
          .selectAll('g.volume-bar-layer')
          .data(series)
          .enter()
          .append('g')
          .attr('class', 'volume-bar-layer')
          .attr('fill', (d) => color(d.key));

        const rects = layerSel
          .selectAll('rect.volume-bar-segment')
          .data((d) => d)
          .enter()
          .append('rect')
          .attr('class', 'volume-bar-segment')
          .attr('y', (d) => y(d.data.type))
          .attr('x', (d) => x(d[0]))
          .attr('height', y.bandwidth())
          .attr('width', animate ? 0 : (d) => x(d[1]) - x(d[0]));

        const segmentLabels = layerSel
          .selectAll('text.volume-bar-segment-label')
          .data((d) => d)
          .enter()
          .append('text')
          .attr('class', 'volume-bar-segment-label')
          .attr('y', (d) => y(d.data.type) + y.bandwidth() / 2 + 4)
          .attr('x', (d) => x(d[0]) + (x(d[1]) - x(d[0])) / 2)
          .attr('text-anchor', 'middle')
          .text((d) => {
            const val = d[1] - d[0];
            const total = d.data.total;
            const segW = x(d[1]) - x(d[0]);
            if (val <= 0 || total <= 0 || segW < 44) return '';
            const percentage = ((val / total) * 100).toFixed(1);
            return `${val.toLocaleString()} (${percentage}%)`;
          })
          .style('opacity', animate ? 0 : 1);

        const totals = g
          .selectAll('text.volume-bar-total-label')
          .data(barData)
          .enter()
          .append('text')
          .attr('class', 'volume-bar-total-label')
          .attr('y', (d) => y(d.type) + y.bandwidth() / 2 + 5)
          .attr('x', (d) => x(d.total) + 15)
          .attr('text-anchor', 'start')
          .text((d) => d.total.toLocaleString())
          .style('opacity', animate ? 0 : 1);

        if (animate) {
          rects
            .transition()
            .duration(BAR_DURATION_MS)
            .ease(d3.easeExpOut)
            .attr('width', (d) => x(d[1]) - x(d[0]));

          segmentLabels
            .transition()
            .delay(SEGMENT_LABEL_DELAY_MS)
            .duration(SEGMENT_LABEL_FADE_MS)
            .ease(d3.easeCubicOut)
            .style('opacity', 1);

          totals
            .transition()
            .delay(SEGMENT_LABEL_DELAY_MS)
            .duration(SEGMENT_LABEL_FADE_MS)
            .ease(d3.easeCubicOut)
            .style('opacity', 1);
        }
      }

      animateQuiz2Chart = function animateQuiz2Chart() {
        if (introHasRun) return;

        window.clearTimeout(pendingIntroTimer);
        pendingIntroTimer = window.setTimeout(() => {
          pendingIntroTimer = null;
          if (!reveal.classList.contains('is-visible')) return;
          if (introHasRun) return;

          ensureData().then((data) => {
            if (!data || !data.length) {
              root.innerHTML =
                '<p class="volume-bar-error">Chart data unavailable. Add <code>netflix_cleaned_categorized.csv</code> or check CSV <code>type</code> / <code>country_clean</code> values.</p>';
              return;
            }
            introHasRun = true;
            render(true);
            bindResizeOnce();
          });
        }, LAYOUT_SETTLE_MS);
      };

      void ensureData();

      if (reveal.classList.contains('is-visible')) {
        animateQuiz2Chart();
      }
    };

    /* ---------------------------------------------------------
       6d. Deep dive — Content pivot (movie vs show volume slider)
       --------------------------------------------------------- */
    const initContentPivotSlider = () => {
      if (typeof window.d3 === 'undefined') return;

      const d3 = window.d3;
      const host = document.getElementById('chart-global-growth-rate');
      const container = document.getElementById('content-pivot-comparison');
      const movieLayer = document.getElementById('content-pivot-movie-layer');
      const showLayer = document.getElementById('content-pivot-show-layer');
      const handle = document.getElementById('content-pivot-slider-handle');
      if (!host || !container || !movieLayer || !showLayer || !handle) return;

      const csvUrl = 'netflix_cleaned_categorized.csv';
      const margin = { top: 52, right: 36, bottom: 48, left: 68 };

      let slidePct = 50;
      let cachedMovie = null;
      let cachedShow = null;
      let hintPlayed = false;
      let resizeTimer = null;

      const applyClip = (pct) => {
        slidePct = Math.max(0, Math.min(100, pct));
        const inset = `${slidePct}%`;
        showLayer.style.clipPath = `inset(0 0 0 ${inset})`;
        showLayer.style.webkitClipPath = `inset(0 0 0 ${inset})`;
        handle.style.left = `${slidePct}%`;
        handle.setAttribute('aria-valuenow', String(Math.round(slidePct)));
      };

      const moveFromClientX = (clientX) => {
        handle.classList.remove('content-pivot-slider-handle--hint');
        const rect = container.getBoundingClientRect();
        let xPos = clientX - rect.left;
        xPos = Math.max(0, Math.min(xPos, rect.width));
        const pct = rect.width ? (xPos / rect.width) * 100 : 50;
        applyClip(pct);
      };

      container.addEventListener('pointermove', (e) => moveFromClientX(e.clientX));
      container.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        if (t) moveFromClientX(t.clientX);
      }, { passive: true });
      container.addEventListener('touchmove', (e) => {
        if (e.cancelable) e.preventDefault();
        const t = e.touches[0];
        if (t) moveFromClientX(t.clientX);
      }, { passive: false });

      handle.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          applyClip(slidePct - 5);
          e.preventDefault();
        } else if (e.key === 'ArrowRight') {
          applyClip(slidePct + 5);
          e.preventDefault();
        }
      });

      const drawLayers = () => {
        if (!cachedMovie || !cachedShow) return;

        movieLayer.innerHTML = '';
        showLayer.innerHTML = '';

        const outerW = Math.max(280, Math.floor(container.getBoundingClientRect().width));
        const innerW = Math.max(120, outerW - margin.left - margin.right);
        const innerH = Math.round(Math.min(420, Math.max(220, outerW * 0.46)));
        const outerH = margin.top + innerH + margin.bottom;

        container.style.height = `${outerH}px`;

        const years = cachedMovie.map((d) => d.year);
        const x = d3.scaleLinear().domain(d3.extent(years)).range([0, innerW]);
        const yMax = d3.max([...cachedMovie, ...cachedShow], (d) => d.count) || 1;
        const y = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

        const renderLayer = (el, data, prefix) => {
          const svg = d3
            .select(el)
            .append('svg')
            .attr('width', '100%')
            .attr('height', null)
            .attr('preserveAspectRatio', 'xMidYMin meet')
            .attr('viewBox', `0 0 ${outerW} ${outerH}`)
            .style('background', '#141414');

          const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

          g.append('g')
            .attr('transform', `translate(0,${innerH})`)
            .attr('class', 'content-pivot-axis axis')
            .call(d3.axisBottom(x).tickFormat(d3.format('d')));

          g.append('g')
            .attr('class', 'content-pivot-axis axis')
            .call(d3.axisLeft(y).ticks(6));

          const area = d3
            .area()
            .x((d) => x(d.year))
            .y0(innerH)
            .y1((d) => y(d.count))
            .curve(d3.curveMonotoneX);

          const line = d3
            .line()
            .x((d) => x(d.year))
            .y((d) => y(d.count))
            .curve(d3.curveMonotoneX);

          g.append('path').datum(data).attr('class', `content-pivot-area-${prefix}`).attr('d', area);
          g.append('path').datum(data).attr('class', `content-pivot-line-${prefix}`).attr('d', line);
        };

        renderLayer(movieLayer, cachedMovie, 'movie');
        renderLayer(showLayer, cachedShow, 'show');
        applyClip(slidePct);
      };

      const scheduleResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => drawLayers(), 100);
      };

      applyClip(50);

      d3.csv(csvUrl)
        .then((rawData) => {
          const uniqueMap = new Map();
          rawData.forEach((d) => {
            const score = +d.imdb_score;
            const year = +d.release_year;
            if (!uniqueMap.has(d.id) && !Number.isNaN(score) && score > 0 && !Number.isNaN(year)) {
              uniqueMap.set(d.id, { year, type: String(d.type || '').toUpperCase() });
            }
          });
          const cleanedData = Array.from(uniqueMap.values());
          const nestedData = d3.rollup(
            cleanedData,
            (v) => v.length,
            (row) => row.year,
            (row) => row.type
          );
          const years = Array.from(nestedData.keys())
            .filter((y) => !Number.isNaN(y))
            .sort(d3.ascending);
          if (!years.length) {
            container.innerHTML =
              '<p class="content-pivot-error">No yearly title data found in the CSV.</p>';
            return;
          }
          cachedMovie = years.map((y) => ({
            year: y,
            count: nestedData.get(y)?.get('MOVIE') ?? 0,
          }));
          cachedShow = years.map((y) => ({
            year: y,
            count: nestedData.get(y)?.get('SHOW') ?? 0,
          }));

          drawLayers();

          if (!hintPlayed) {
            hintPlayed = true;
            handle.classList.add('content-pivot-slider-handle--hint');
            window.setTimeout(() => handle.classList.remove('content-pivot-slider-handle--hint'), 2600);
          }

          if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => scheduleResize());
            ro.observe(container);
          }
          window.addEventListener('resize', scheduleResize, { passive: true });
        })
        .catch(() => {
          container.innerHTML =
            '<p class="content-pivot-error">Chart data unavailable. Add <code>netflix_cleaned_categorized.csv</code> next to this page.</p>';
        });
    };

    /* ---------------------------------------------------------
       6d-bis. Deep dive — Regional dual charts (US vs Non-US)
       --------------------------------------------------------- */
    const initRegionalDualCharts = () => {
      if (typeof window.d3 === 'undefined') return;

      const d3 = window.d3;
      const block = document.getElementById('block-regional-pivot');
      const usContainer = document.getElementById('regional-pivot-us-container');
      const intlContainer = document.getElementById('regional-pivot-intl-container');
      if (!block || !usContainer || !intlContainer) return;

      const csvUrl = 'netflix_cleaned_categorized.csv';
      const margin = { top: 60, right: 20, bottom: 30, left: 45 };
      const containers = [usContainer, intlContainer];

      let usData = null;
      let intlData = null;
      let minYear = Infinity;
      let maxYear = -Infinity;
      let fullYears = [];
      let globalMaxY = 1;
      let slidePct = 50;
      let resizeTimer = null;
      let listenersBound = false;

      const measureDims = (el) => {
        const r = el.getBoundingClientRect();
        const cw = Math.max(200, Math.floor(r.width));
        const ch = Math.max(220, Math.floor(r.height));
        return { cw, ch };
      };

      const applyClipAll = (pct) => {
        slidePct = Math.max(0, Math.min(100, pct));
        containers.forEach((container) => {
          const movieLayerEl = container.querySelector('.movie-layer');
          const showLayerEl = container.querySelector('.show-layer');
          const handleEl = container.querySelector('.regional-dual-slider-handle');
          if (!movieLayerEl || !showLayerEl || !handleEl) return;
          movieLayerEl.style.clipPath = `inset(0 ${100 - slidePct}% 0 0)`;
          movieLayerEl.style.webkitClipPath = `inset(0 ${100 - slidePct}% 0 0)`;
          showLayerEl.style.clipPath = `inset(0 0 0 ${slidePct}%)`;
          showLayerEl.style.webkitClipPath = `inset(0 0 0 ${slidePct}%)`;
          handleEl.style.left = `${slidePct}%`;
          handleEl.style.transform = 'translateX(-50%)';
        });
      };

      const syncSliders = (clientX, sourceContainer) => {
        const rect = sourceContainer.getBoundingClientRect();
        let xPos = clientX - rect.left;
        xPos = Math.max(0, Math.min(xPos, rect.width));
        const percentage = rect.width ? (xPos / rect.width) * 100 : 50;
        applyClipAll(percentage);
      };

      const renderLayer = (containerEl, layerSel, data, colorClass, dims) => {
        const { cw, ch } = dims;
        const innerW = Math.max(40, cw - margin.left - margin.right);
        const innerH = Math.max(40, ch - margin.top - margin.bottom);
        const layer = d3.select(containerEl).select(layerSel);
        layer.selectAll('*').remove();

        const svg = layer
          .append('svg')
          .attr('viewBox', `0 0 ${cw} ${ch}`)
          .attr('width', '100%')
          .attr('height', '100%')
          .attr('preserveAspectRatio', 'xMidYMid meet');

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const xRp = d3.scaleLinear().domain([minYear, maxYear]).range([0, innerW]);
        const yRp = d3.scaleLinear().domain([0, globalMaxY]).range([innerH, 0]);

        g.append('g')
          .attr('transform', `translate(0,${innerH})`)
          .attr('class', 'regional-dual-axis axis')
          .call(d3.axisBottom(xRp).tickFormat(d3.format('d')).ticks(8));

        g.append('g').attr('class', 'regional-dual-axis axis').call(d3.axisLeft(yRp).ticks(5));

        const area = d3
          .area()
          .x((d) => xRp(d.year))
          .y0(innerH)
          .y1((d) => yRp(d.count))
          .curve(d3.curveMonotoneX);

        const line = d3
          .line()
          .x((d) => xRp(d.year))
          .y((d) => yRp(d.count))
          .curve(d3.curveMonotoneX);

        g.append('path').datum(data).attr('class', `area-${colorClass}`).attr('d', area);
        g.append('path').datum(data).attr('class', `line-${colorClass}`).attr('d', line);
      };

      const draw = () => {
        if (!usData || !intlData) return;
        const dims = measureDims(usContainer);
        renderLayer(usContainer, '.movie-layer', usData.movieData, 'movie', dims);
        renderLayer(usContainer, '.show-layer', usData.showData, 'show', dims);
        renderLayer(intlContainer, '.movie-layer', intlData.movieData, 'movie', dims);
        renderLayer(intlContainer, '.show-layer', intlData.showData, 'show', dims);
        applyClipAll(slidePct);
      };

      const scheduleResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => draw(), 80);
      };

      const bindInteractions = () => {
        if (listenersBound) return;
        listenersBound = true;
        containers.forEach((container) => {
          container.addEventListener('pointermove', (e) => syncSliders(e.clientX, container));
          container.addEventListener(
            'touchmove',
            (e) => {
              const t = e.touches[0];
              if (t) syncSliders(t.clientX, container);
            },
            { passive: true }
          );
        });
      };

      d3.csv(csvUrl)
        .then((rawData) => {
          const uniqueMapUS = new Map();
          const uniqueMapIntl = new Map();
          minYear = Infinity;
          maxYear = -Infinity;

          rawData.forEach((d) => {
            const score = +d.imdb_score;
            const year = +d.release_year;
            const country = d.country_clean;
            const key = `${d.id}_${year}`;

            if (!Number.isNaN(score) && score > 0) {
              if (year < minYear) minYear = year;
              if (year > maxYear) maxYear = year;
              const dataPoint = { year, type: d.type ? String(d.type).toUpperCase() : 'UNKNOWN' };
              if (country === 'US') {
                if (!uniqueMapUS.has(key)) uniqueMapUS.set(key, dataPoint);
              } else if (!uniqueMapIntl.has(key)) {
                uniqueMapIntl.set(key, dataPoint);
              }
            }
          });

          if (!Number.isFinite(minYear) || !Number.isFinite(maxYear) || minYear > maxYear) {
            const wrap = block.querySelector('.regional-dual-charts-wrapper');
            if (wrap) {
              wrap.innerHTML =
                '<p class="content-pivot-error">No yearly title data found in the CSV.</p>';
            }
            return;
          }

          fullYears = d3.range(minYear, maxYear + 1);

          const processData = (mapData) => {
            const arrayData = Array.from(mapData.values());
            const nestedData = d3.rollup(
              arrayData,
              (v) => v.length,
              (row) => row.year,
              (row) => row.type
            );
            const movieData = fullYears.map((y) => ({
              year: y,
              count: nestedData.get(y)?.get('MOVIE') || 0,
            }));
            const showData = fullYears.map((y) => ({
              year: y,
              count: nestedData.get(y)?.get('SHOW') || 0,
            }));
            return { movieData, showData };
          };

          usData = processData(uniqueMapUS);
          intlData = processData(uniqueMapIntl);

          const allCounts = [
            ...usData.movieData,
            ...usData.showData,
            ...intlData.movieData,
            ...intlData.showData,
          ].map((d) => d.count);
          globalMaxY = Math.max(1, d3.max(allCounts) || 0);

          draw();
          bindInteractions();

          if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => scheduleResize());
            ro.observe(usContainer);
          }
          window.addEventListener('resize', scheduleResize, { passive: true });
        })
        .catch(() => {
          const wrap = block.querySelector('.regional-dual-charts-wrapper');
          if (wrap) {
            wrap.innerHTML =
              '<p class="content-pivot-error">Chart data unavailable. Add <code>netflix_cleaned_categorized.csv</code> next to this page.</p>';
          }
        });
    };

    /* ---------------------------------------------------------
       6e. Deep dive — International production (multi-line D3)
       --------------------------------------------------------- */
    const initInternationalTrendsChart = () => {
      if (typeof window.d3 === 'undefined') return;

      const d3 = window.d3;
      const host = document.getElementById('chart-international-trends');
      const chartEl = document.getElementById('intl-chart-container');
      const yearDisplay = document.getElementById('intl-year-display');
      const capsuleRoot = document.getElementById('intl-country-capsules');
      const tip = d3.select('#intl-trends-tooltip');
      if (!host || !chartEl || !yearDisplay || !capsuleRoot || tip.empty()) return;

      const COUNTRY_LABEL = {
        US: 'US',
        IN: 'India',
        GB: 'UK',
        JP: 'Japan',
        FR: 'France',
        KR: 'South Korea',
      };

      const margin = { top: 28, right: 28, bottom: 44, left: 56 };
      const chartWidthScale = 0.85;
      const csvUrl = 'netflix_cleaned_categorized.csv';
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const tMs = reduceMotion ? 0 : 500;

      let cleanedData = [];
      let yearExtent = [2000, 2025];
      let currentCountryData = [];
      let innerW = 300;
      let innerH = 240;
      let lastPointerEvent = null;
      let activeYear = 2015;
      let selectedCountry = 'US';

      let svg = null;
      let plotG = null;
      let x = null;
      let y = null;
      let xAxisG = null;
      let yAxisG = null;
      let pathAM = null;
      let pathAS = null;
      let pathLM = null;
      let pathLS = null;
      let vLine = null;
      let dotM = null;
      let dotS = null;

      const setActiveCountry = (code) => {
        selectedCountry = code;
        capsuleRoot.querySelectorAll('.intl-capsule').forEach((btn) => {
          const on = btn.dataset.country === code;
          btn.classList.toggle('intl-capsule--active', on);
          btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      };

      const showTooltip = (event, html) => {
        const cx = event.clientX ?? event.touches?.[0]?.clientX;
        const cy = event.clientY ?? event.touches?.[0]?.clientY;
        if (typeof cx !== 'number' || typeof cy !== 'number') return;
        tip
          .style('display', 'block')
          .html(html)
          .style('left', `${cx + 14}px`)
          .style('top', `${cy - 44}px`)
          .style('transform', 'none');
      };

      const layout = () => {
        const chartW = Math.max(280, Math.floor(chartEl.getBoundingClientRect().width));
        const outerW = Math.max(240, Math.floor(chartW * chartWidthScale));
        innerW = Math.max(100, outerW - margin.left - margin.right);
        innerH = Math.round(Math.min(400, Math.max(200, outerW * 0.42)));
        const outerH = margin.top + innerH + margin.bottom;
        return { outerW, outerH };
      };

      const mkAreaM = () =>
        d3
          .area()
          .x((d) => x(d.year))
          .y0(innerH)
          .y1((d) => y(d.MOVIE))
          .curve(d3.curveMonotoneX);

      const mkAreaS = () =>
        d3
          .area()
          .x((d) => x(d.year))
          .y0(innerH)
          .y1((d) => y(d.SHOW))
          .curve(d3.curveMonotoneX);

      const mkLineM = () =>
        d3
          .line()
          .x((d) => x(d.year))
          .y((d) => y(d.MOVIE))
          .curve(d3.curveMonotoneX);

      const mkLineS = () =>
        d3
          .line()
          .x((d) => x(d.year))
          .y((d) => y(d.SHOW))
          .curve(d3.curveMonotoneX);

      const buildScaffold = () => {
        chartEl.textContent = '';
        const { outerW, outerH } = layout();
        x = d3.scaleLinear().domain(yearExtent).range([0, innerW]);
        y = d3.scaleLinear().domain([0, 1]).range([innerH, 0]);

        svg = d3
          .select(chartEl)
          .append('svg')
          .attr('role', 'img')
          .attr('height', null)
          .attr('viewBox', `0 0 ${outerW} ${outerH}`)
          .attr('preserveAspectRatio', 'xMidYMin meet');

        plotG = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        xAxisG = plotG
          .append('g')
          .attr('class', 'intl-axis intl-axis--x axis')
          .attr('transform', `translate(0,${innerH})`);
        yAxisG = plotG.append('g').attr('class', 'intl-axis intl-axis--y axis');

        pathAM = plotG.append('path').attr('class', 'intl-area-movie');
        pathAS = plotG.append('path').attr('class', 'intl-area-show');
        pathLM = plotG.append('path').attr('class', 'intl-line-movie');
        pathLS = plotG.append('path').attr('class', 'intl-line-show');

        vLine = plotG
          .append('line')
          .attr('class', 'intl-hover-line')
          .attr('y1', 0)
          .attr('y2', innerH)
          .style('display', 'none');

        dotM = plotG.append('circle').attr('r', 5).attr('fill', '#e50914').style('display', 'none');
        dotS = plotG.append('circle').attr('r', 5).attr('fill', '#ffffff').style('display', 'none');
      };

      const updateCountry = (countryCode, animate) => {
        const filtered = cleanedData.filter((d) => d.country === countryCode);
        const nested = d3.rollup(
          filtered,
          (v) => v.length,
          (row) => row.year,
          (row) => row.type
        );
        const years = Array.from(nested.keys())
          .filter((yr) => !Number.isNaN(yr))
          .sort(d3.ascending);
        currentCountryData = years.map((yr) => ({
          year: yr,
          MOVIE: nested.get(yr)?.get('MOVIE') ?? 0,
          SHOW: nested.get(yr)?.get('SHOW') ?? 0,
        }));

        const maxV = d3.max(currentCountryData, (d) => Math.max(d.MOVIE, d.SHOW));
        y.domain([0, (maxV > 0 ? maxV : 1) * 1.1]);

        const dur = animate ? tMs : 0;
        const xAxis = d3.axisBottom(x).tickFormat(d3.format('d')).tickSizeOuter(0);
        const yAxis = d3.axisLeft(y).ticks(6).tickSizeOuter(0);
        xAxisG.call(xAxis);
        if (dur) {
          yAxisG.transition().duration(dur).call(yAxis);
          pathAM.transition().duration(dur).attr('d', mkAreaM()(currentCountryData));
          pathAS.transition().duration(dur).attr('d', mkAreaS()(currentCountryData));
          pathLM.transition().duration(dur).attr('d', mkLineM()(currentCountryData));
          pathLS.transition().duration(dur).attr('d', mkLineS()(currentCountryData));
        } else {
          yAxisG.call(yAxis);
          pathAM.attr('d', mkAreaM()(currentCountryData));
          pathAS.attr('d', mkAreaS()(currentCountryData));
          pathLM.attr('d', mkLineM()(currentCountryData));
          pathLS.attr('d', mkLineS()(currentCountryData));
        }
      };

      const updateYear = (year, event) => {
        if (event) lastPointerEvent = event;
        const yRounded = Math.max(yearExtent[0], Math.min(yearExtent[1], Math.round(year)));
        activeYear = yRounded;
        yearDisplay.textContent = String(yRounded);

        if (!currentCountryData.length || !x || !y) {
          tip.style('display', 'none');
          return;
        }

        const bisect = d3.bisector((d) => d.year).center;
        const idx = bisect(currentCountryData, yRounded);
        const j = Math.max(0, Math.min(currentCountryData.length - 1, idx));
        const d = currentCountryData[j];

        if (d) {
          const posX = x(d.year);
          vLine.attr('x1', posX).attr('x2', posX).style('display', null);
          dotM.attr('cx', posX).attr('cy', y(d.MOVIE)).style('display', null);
          dotS.attr('cx', posX).attr('cy', y(d.SHOW)).style('display', null);
          const regionLabel = COUNTRY_LABEL[selectedCountry] ?? selectedCountry;
          const html =
            `<strong>${d.year} | ${regionLabel}</strong><br>` +
            `<span style="color:#e50914">Movies: ${d.MOVIE}</span><br>` +
            `Shows: ${d.SHOW}`;
          if (lastPointerEvent) showTooltip(lastPointerEvent, html);
        } else {
          vLine.style('display', 'none');
          dotM.style('display', 'none');
          dotS.style('display', 'none');
          tip.style('display', 'none');
        }
      };

      const resizeChart = () => {
        if (!svg) return;
        const { outerW, outerH } = layout();
        svg.attr('viewBox', `0 0 ${outerW} ${outerH}`);
        x.range([0, innerW]);
        y.range([innerH, 0]);
        xAxisG.attr('transform', `translate(0,${innerH})`);
        vLine.attr('y2', innerH);
        updateCountry(selectedCountry, false);
        updateYear(activeYear, null);
      };

      let resizeTimer = null;
      const scheduleResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => resizeChart(), 80);
      };

      chartEl.addEventListener('pointermove', (e) => {
        if (!plotG || !x) return;
        const [mx] = d3.pointer(e, plotG.node());
        if (mx < 0 || mx > innerW) return;
        updateYear(x.invert(mx), e);
      });

      chartEl.addEventListener('pointerdown', (e) => {
        if (!plotG || !x) return;
        const [mx] = d3.pointer(e, plotG.node());
        if (mx < 0 || mx > innerW) return;
        updateYear(x.invert(mx), e);
      });

      chartEl.addEventListener('pointerleave', () => {
        lastPointerEvent = null;
        tip.style('display', 'none');
        vLine.style('display', 'none');
        dotM.style('display', 'none');
        dotS.style('display', 'none');
      });

      capsuleRoot.addEventListener('click', (e) => {
        const btn = e.target.closest('.intl-capsule');
        if (!btn || !capsuleRoot.contains(btn)) return;
        const code = btn.dataset.country;
        if (!code || code === selectedCountry) return;
        setActiveCountry(code);
        updateCountry(code, true);
        updateYear(activeYear, lastPointerEvent);
      });

      d3.csv(csvUrl)
        .then((rawData) => {
          const uniqueMap = new Map();
          rawData.forEach((d) => {
            const score = +d.imdb_score;
            const year = +d.release_year;
            const country = String(d.country_clean || 'Unknown').trim();
            if (!uniqueMap.has(d.id) && !Number.isNaN(score) && score > 0 && !Number.isNaN(year)) {
              uniqueMap.set(d.id, { year, type: String(d.type || '').toUpperCase(), country });
            }
          });
          cleanedData = Array.from(uniqueMap.values());
          const ys = cleanedData.map((row) => row.year).filter((yr) => !Number.isNaN(yr));
          const ex = d3.extent(ys);
          if (ex[0] == null || ex[1] == null) {
            chartEl.innerHTML = '<p class="content-pivot-error">No yearly data in CSV.</p>';
            return;
          }
          yearExtent = ex;
          const iy = Math.round(Math.max(yearExtent[0], Math.min(yearExtent[1], 2015)));
          activeYear = iy;
          yearDisplay.textContent = String(iy);

          buildScaffold();
          const initialBtn = capsuleRoot.querySelector('.intl-capsule--active');
          const startCode = initialBtn?.dataset.country || 'US';
          setActiveCountry(startCode);
          updateCountry(selectedCountry, false);
          updateYear(iy, null);

          if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => scheduleResize());
            ro.observe(chartEl);
          }
          window.addEventListener('resize', scheduleResize, { passive: true });
        })
        .catch(() => {
          const wrap = document.getElementById('intl-viz-wrapper');
          if (wrap) {
            wrap.innerHTML =
              '<p class="content-pivot-error">Chart data unavailable. Add <code>netflix_cleaned_categorized.csv</code> next to this page.</p>';
          }
        });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initRevealBoxplot();
        initRevealRegionalBoxplots();
        initReveal2VolumeBar();
        initContentPivotSlider();
        initRegionalDualCharts();
        initInternationalTrendsChart();
      });
    } else {
      initRevealBoxplot();
      initRevealRegionalBoxplots();
      initReveal2VolumeBar();
      initContentPivotSlider();
      initRegionalDualCharts();
      initInternationalTrendsChart();
    }

    /* ---------------------------------------------------------
       7. 2015 Flood — twin D3 line charts (volume vs. quality)
       --------------------------------------------------------- */
    const initFloodTwinCharts = () => {
      if (typeof window.d3 === 'undefined') return;

      const d3 = window.d3;
      const wrapper = document.getElementById('flood-viz-wrapper');
      const countHost = document.getElementById('flood-count-chart');
      const scoreHost = document.getElementById('flood-score-chart');
      const sliderEl = document.getElementById('flood-year-slider');
      const dualViz = document.getElementById('flood-dual-viz');

      if (!wrapper || !countHost || !scoreHost || !sliderEl || !dualViz) return;

      const margin = { top: 12, right: 28, bottom: 36, left: 54 };
      const baseHeight = 240;
      const minOuterWidth = 280;

      const tooltip = d3.select('#flood-tooltip');
      const csvUrl = 'netflix_cleaned_categorized.csv';

      let yearlyStats = [];
      let yearExtent = [2000, 2020];
      let bisectYear = d3.bisector((d) => d.year).center;

      let innerWidth = 400;
      let innerHeight = baseHeight - margin.top - margin.bottom;
      let totalWidth = minOuterWidth;

      let svgCountLayer;
      let svgScoreLayer;
      let xScale;
      let yCount;
      let yScore;
      let vLine1;
      let vLine2;
      let focusC;
      let focusS;

      const getOuterWidth = () => {
        const w = wrapper.getBoundingClientRect().width;
        return Math.max(minOuterWidth, Math.floor(w || minOuterWidth));
      };

      const snapYear = (yFloat) => {
        if (!yearlyStats.length) return Math.round(yFloat);
        const idx = bisectYear(yearlyStats, yFloat);
        const i = Math.max(0, Math.min(yearlyStats.length - 1, idx));
        return yearlyStats[i].year;
      };

      const showTooltipAtClient = (event, html) => {
        const cx = event.clientX ?? event.touches?.[0]?.clientX;
        const cy = event.clientY ?? event.touches?.[0]?.clientY;
        if (typeof cx !== 'number' || typeof cy !== 'number') return;
        tooltip
          .style('display', 'block')
          .html(html)
          .style('left', `${cx + 14}px`)
          .style('top', `${cy - 44}px`);
      };

      const showTooltipCentered = (html) => {
        const r = wrapper.getBoundingClientRect();
        tooltip
          .style('display', 'block')
          .html(html)
          .style('left', `${r.left + r.width / 2}px`)
          .style('top', `${r.top + 88}px`)
          .style('transform', 'translate(-50%, 0)');
      };

      function update(year, event) {
        year = snapYear(year);
        const d = yearlyStats.find((s) => s.year === year);
        d3.select('#flood-year-display').text(String(year));
        sliderEl.value = String(year);

        if (!d || !xScale) return;

        const posX = xScale(year);
        [vLine1, vLine2].forEach((l) => {
          if (l) l.attr('x1', posX).attr('x2', posX).style('display', null);
        });
        if (focusC) focusC.attr('cx', posX).attr('cy', yCount(d.count)).style('display', null);
        if (focusS) focusS.attr('cx', posX).attr('cy', yScore(d.medianScore)).style('display', null);

        const html = `<strong>${year}</strong><br>Titles: ${d.count}<br>Median score: ${(d.medianScore != null ? d.medianScore : 0).toFixed(1)}`;

        if (event && event.type === 'input') {
          showTooltipCentered(html);
        } else if (event && (typeof event.clientX === 'number' || event.touches?.[0])) {
          tooltip.style('transform', '');
          showTooltipAtClient(event, html);
        }
      }

      function draw() {
        totalWidth = getOuterWidth();
        innerWidth = Math.max(80, totalWidth - margin.left - margin.right);
        innerHeight = baseHeight - margin.top - margin.bottom;

        countHost.innerHTML = '';
        scoreHost.innerHTML = '';

        const mkSvg = (host) => {
          const svg = d3
            .select(host)
            .append('svg')
            .attr('width', '100%')
            .attr('height', null)
            .attr('preserveAspectRatio', 'xMidYMin meet')
            .attr('viewBox', `0 0 ${totalWidth} ${baseHeight}`)
            .style('background', 'transparent');

          return svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
        };

        svgCountLayer = mkSvg(countHost);
        svgScoreLayer = mkSvg(scoreHost);

        if (!yearlyStats.length) return;

        xScale = d3.scaleLinear().domain(yearExtent).range([0, innerWidth]);
        yCount = d3
          .scaleLinear()
          .domain([0, d3.max(yearlyStats, (d) => d.count)])
          .range([innerHeight, 0]);
        yScore = d3.scaleLinear().domain([0, 10]).range([innerHeight, 0]);

        const xAxis = d3.axisBottom(xScale).tickFormat(d3.format('d'));
        const yAxisCount = d3.axisLeft(yCount).ticks(4);
        const yAxisScore = d3.axisLeft(yScore).ticks(5);

        svgCountLayer.append('g').attr('class', 'axis').attr('transform', `translate(0,${innerHeight})`).call(xAxis);
        svgScoreLayer.append('g').attr('class', 'axis').attr('transform', `translate(0,${innerHeight})`).call(xAxis);

        svgCountLayer.append('g').attr('class', 'axis').call(yAxisCount);
        svgScoreLayer.append('g').attr('class', 'axis').call(yAxisScore);

        svgCountLayer
          .append('path')
          .datum(yearlyStats)
          .attr('class', 'line-count')
          .attr(
            'd',
            d3
              .line()
              .x((d) => xScale(d.year))
              .y((d) => yCount(d.count))
              .curve(d3.curveMonotoneX)
          );

        svgScoreLayer
          .append('path')
          .datum(yearlyStats)
          .attr('class', 'line-score')
          .attr(
            'd',
            d3
              .line()
              .x((d) => xScale(d.year))
              .y((d) => yScore(d.medianScore))
              .curve(d3.curveMonotoneX)
          );

        vLine1 = svgCountLayer
          .append('line')
          .attr('class', 'hover-line')
          .attr('y1', 0)
          .attr('y2', innerHeight)
          .style('display', 'none');

        vLine2 = svgScoreLayer
          .append('line')
          .attr('class', 'hover-line')
          .attr('y1', 0)
          .attr('y2', innerHeight)
          .style('display', 'none');

        focusC = svgCountLayer.append('circle').attr('class', 'focus-count').attr('r', 6).style('display', 'none');

        focusS = svgScoreLayer.append('circle').attr('class', 'focus-score').attr('r', 6).style('display', 'none');

        const onPointer = (event) => {
          const [mx] = d3.pointer(event, svgCountLayer.node());
          const yf = xScale.invert(mx);
          if (yf >= yearExtent[0] && yf <= yearExtent[1]) {
            update(yf, event);
          }
        };

        svgCountLayer
          .append('rect')
          .attr('class', 'flood-hit-rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', innerWidth)
          .attr('height', innerHeight)
          .attr('fill', 'transparent')
          .style('cursor', 'ew-resize')
          .on('mousemove pointermove', onPointer)
          .on('touchmove', function (event) {
            event.preventDefault();
            onPointer(event);
          }, { passive: false });

        svgScoreLayer
          .append('rect')
          .attr('class', 'flood-hit-rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', innerWidth)
          .attr('height', innerHeight)
          .attr('fill', 'transparent')
          .style('cursor', 'ew-resize')
          .on('mousemove pointermove', onPointer)
          .on('touchmove', function (event) {
            event.preventDefault();
            onPointer(event);
          }, { passive: false });

        const yCur = snapYear(+sliderEl.value || yearExtent[0]);
        update(yCur, null);
      }

      d3.csv(csvUrl)
        .then((rawData) => {
          const uniqueMap = new Map();
          rawData.forEach((d) => {
            const score = +d.imdb_score;
            const year = +d.release_year;
            if (!uniqueMap.has(d.id) && !Number.isNaN(score) && score > 0) {
              uniqueMap.set(d.id, { year, score });
            }
          });

          const cleanedData = Array.from(uniqueMap.values());

          yearlyStats = d3
            .rollups(
              cleanedData,
              (v) => ({
                count: v.length,
                medianScore: d3.median(v, (row) => row.score),
              }),
              (row) => row.year
            )
            .sort((a, b) => a[0] - b[0])
            .map(([year, stats]) => ({ year, ...stats }));

          yearExtent = d3.extent(yearlyStats, (d) => d.year);
          bisectYear = d3.bisector((d) => d.year).center;

          let yInit = 2015;
          if (yearExtent[0] != null && yearExtent[1] != null) {
            yInit = Math.min(Math.max(2015, yearExtent[0]), yearExtent[1]);
          }
          yInit = snapYear(yInit);

          sliderEl.min = String(yearExtent[0]);
          sliderEl.max = String(yearExtent[1]);
          sliderEl.value = String(yInit);

          draw();

          sliderEl.addEventListener('input', function () {
            update(+this.value, { type: 'input' });
          });

          dualViz.addEventListener('mouseleave', () => {
            tooltip.style('display', 'none').style('transform', '');
          });

          let resizeT = null;
          const onResize = () => {
            window.clearTimeout(resizeT);
            resizeT = window.setTimeout(() => {
              draw();
              const yCur = +d3.select('#flood-year-display').text() || yInit;
              update(yCur, null);
            }, 120);
          };
          window.addEventListener('resize', onResize, { passive: true });

          if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => onResize());
            ro.observe(wrapper);
          }
        })
        .catch((err) => {
          console.error('Flood charts: could not load', csvUrl, err);
          countHost.innerHTML = '<p class="flood-body" style="padding:12px 0">Chart data unavailable. Add <code>netflix_cleaned_categorized.csv</code> next to this page.</p>';
        });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initFloodTwinCharts);
    } else {
      initFloodTwinCharts();
    }

  })();