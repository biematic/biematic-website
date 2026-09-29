const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const password = event.headers['x-dashboard-password'];

  if (!password || password !== process.env.DASHBOARD_PASSWORD) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('click_events')
    .select('visitor_id, event_type, broker, page, referrer, created_at')
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) {
    console.error('Supabase query failed:', JSON.stringify(error));
    return { statusCode: 500, body: 'Failed to load data: ' + error.message };
  }

  const brokerEvents = data.filter((e) => e.event_type === 'broker');
  const metacopierEvents = data.filter((e) => e.event_type === 'metacopier');

  const clicksPerBroker = {};
  for (const e of brokerEvents) {
    const key = e.broker || 'onbekend';
    clicksPerBroker[key] = (clicksPerBroker[key] || 0) + 1;
  }

  const brokerVisitors = new Set(brokerEvents.map((e) => e.visitor_id));
  const metacopierVisitors = new Set(metacopierEvents.map((e) => e.visitor_id));
  const convertedVisitors = [...brokerVisitors].filter((v) => metacopierVisitors.has(v));

  const conversionRate =
    brokerVisitors.size > 0
      ? Math.round((convertedVisitors.length / brokerVisitors.size) * 1000) / 10
      : 0;

  const recentEvents = data.slice(0, 50).map((e) => ({
    created_at: e.created_at,
    event_type: e.event_type,
    broker: e.broker,
    referrer: e.referrer,
  }));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      totalBrokerClicks: brokerEvents.length,
      clicksPerBroker,
      totalMetacopierClicks: metacopierEvents.length,
      conversionRate,
      recentEvents,
    }),
  };
};
