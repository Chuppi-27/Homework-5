(() => {
  const form = document.querySelector('#sizing-form');
  const $ = (id) => document.getElementById(id);
  const standardRatings = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000];
  const frameRatings = [60, 100, 150, 250, 400, 600, 800, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000];
  const fmt = (value, digits = 2) => Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });

  function calculate() {
    if (!form.reportValidity()) return;
    const voltage = Number(document.querySelector('input[name="system"]:checked').value);
    const fixtures = Number($('fixtures').value);
    const wattsEach = Number($('fixture-watts').value);
    const lightPF = Number($('fixture-pf').value);
    const receptacles = Number($('receptacles').value);
    const vaEach = Number($('receptacle-va').value);
    const faultKA = Number($('fault-current').value);
    const breakerAIC = Number($('interrupt-rating').value);

    if (lightPF <= 0 || lightPF > 1) {
      $('fixture-pf').setCustomValidity('Enter a power factor greater than 0 and no greater than 1.');
      form.reportValidity();
      $('fixture-pf').setCustomValidity('');
      return;
    }

    const lightingW = fixtures * wattsEach;
    const receptacleVA = receptacles * vaEach;
    const lightingFactor = $('lighting-continuous').checked ? 1.25 : 1;
    const receptacleFactor = $('receptacle-continuous').checked ? 1.25 : 1;
    // Use P/(sqrt(3)*E*pf): W and PF convert each load to apparent VA;
    // the same result is obtained with total VA divided by sqrt(3)*line voltage.
    const lightingA = (lightingW / (Math.sqrt(3) * voltage * lightPF)) * lightingFactor;
    const receptacleA = (receptacleVA / (Math.sqrt(3) * voltage)) * receptacleFactor;
    const designA = lightingA + receptacleA;
    const trip = standardRatings.find((rating) => rating >= designA);
    const frame = trip ? frameRatings.find((rating) => rating >= trip) : undefined;
    const passesAIC = breakerAIC >= faultKA;
    const panelLabel = voltage === 480 ? '480Y / 277 V lighting panel' : '208Y / 120 V power panel';

    $('load-current').textContent = fmt(designA);
    $('trip-rating').textContent = trip ? fmt(trip, 0) : '—';
    $('frame-rating').textContent = frame ? fmt(frame, 0) : '—';
    $('line-voltage').textContent = voltage;
    $('panel-caption').textContent = panelLabel;
    $('required-aic').textContent = fmt(faultKA, 1);
    $('trip-caption').textContent = trip ? `Next listed trip rating at or above ${fmt(designA)} A` : 'Calculated current exceeds the displayed trip range';
    $('frame-caption').textContent = frame ? `${fmt(frame, 0)} AF generic class for ${fmt(trip, 0)} AT` : 'Catalog selection required';
    $('fault-status').classList.toggle('fail', !passesAIC);
    $('fault-status').setAttribute('role', passesAIC ? 'status' : 'alert');
    $('fault-status').querySelector('.fault-icon').textContent = passesAIC ? '✓' : '!';
    $('fault-message').textContent = passesAIC
      ? `${breakerAIC} kAIC breaker meets the entered ${fmt(faultKA, 1)} kA symmetrical fault current.`
      : `${breakerAIC} kAIC breaker is below the entered ${fmt(faultKA, 1)} kA fault current. Select listed equipment with an adequate interrupting rating and verify the assembly SCCR.`;
    $('result-state').innerHTML = `<span class="status-dot"></span> ${passesAIC ? 'CALCULATED' : 'AIC CHECK FAILED'}`;

    const rows = [
      ['Lighting connected load', `${fixtures} × ${fmt(wattsEach, 0)} W = ${fmt(lightingW, 0)} W`],
      ['Lighting current', `${fmt(lightingW, 0)} W ÷ (√3 × ${voltage} V × ${fmt(lightPF, 2)}) × ${lightingFactor.toFixed(2)} = ${fmt(lightingA)} A`],
      ['Receptacle connected load', `${receptacles} × ${fmt(vaEach, 0)} VA = ${fmt(receptacleVA, 0)} VA`],
      ['Receptacle current', `${fmt(receptacleVA, 0)} VA ÷ (√3 × ${voltage} V) × ${receptacleFactor.toFixed(2)} = ${fmt(receptacleA)} A`],
      ['Total design current', `${fmt(lightingA)} A + ${fmt(receptacleA)} A = ${fmt(designA)} A`],
      ['Trip rating (AT)', trip ? `${fmt(designA)} A → ${fmt(trip, 0)} A standard trip` : 'Above the standard trip range shown; engineering review required'],
      ['Frame rating (AF)', frame ? `${fmt(trip, 0)} AT → ${fmt(frame, 0)} A generic minimum frame candidate` : 'Above the generic frame range shown; catalog selection required'],
      ['Interrupting rating', `${fmt(faultKA, 1)} kA available → breaker rating ${breakerAIC} kAIC (${passesAIC ? 'meets' : 'does not meet'} entered value)`]
    ];
    $('steps').innerHTML = rows.map(([label, value]) => `<div><span>${label}</span><span>${value}</span></div>`).join('');
  }

  form.addEventListener('submit', (event) => { event.preventDefault(); calculate(); });
  form.addEventListener('input', calculate);
  form.addEventListener('change', calculate);
  calculate();
})();
