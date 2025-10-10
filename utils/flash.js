exports.flashCookie = (res, payload) => {
  // payload: { alert:true, alertTitle, alertMessage, alertIcon, showConfirmButton, timer, ruta }
  res.cookie('__alert', JSON.stringify(payload), {
    httpOnly: true,
    sameSite: 'lax',
    // secure: true, // activa si usas HTTPS
    maxAge: 1000 * 30 // 30s es suficiente para PRG
  });
};
