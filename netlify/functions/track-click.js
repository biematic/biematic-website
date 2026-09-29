const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { visitor_id, event_type, broker, page, referrer } = payload;

  if (!visitor_id || !event_type || !['broker', 'metacopier'].includes(event_type)) {
    return { statusCode: 400, body: 'Missing or invalid fields' };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase.from('click_events').insert({
    visitor_id: String(visitor_id).slice(0, 100),
    event_type,
    broker: broker ? String(broker).slice(0, 50) : null,
    page: page ? String(page).slice(0, 200) : null,
    referrer: referrer ? String(referrer).slice(0, 200) : null,
  });

  if (error) {
    console.error('Supabase insert failed:', JSON.stringify(error));
    return { statusCode: 500, body: 'Failed to store event: ' + error.message };
  }

  return { statusCode: 204, body: '' };
};
