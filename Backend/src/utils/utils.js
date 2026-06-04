function generateOTP()
{
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOTP(otp) {

  const digits = otp
    .split("")
    .map(
      (digit) => `
        <div style="
          width:50px;
          height:60px;
          line-height:60px;
          text-align:center;
          font-size:28px;
          font-weight:bold;
          border-radius:10px;
          background:#EEEDFE;
          color:#3C3489;
          display:inline-block;
          margin:0 5px;
        ">
          ${digit}
        </div>
      `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>

<body style="
  margin:0;
  padding:0;
  background:#f4f4f4;
  font-family:Arial,sans-serif;
">

  <div style="
    width:100%;
    padding:40px 0;
    text-align:center;
  ">

    <div style="
      background:white;
      max-width:420px;
      margin:auto;
      padding:30px;
      border-radius:16px;
      box-shadow:0 4px 20px rgba(0,0,0,0.1);
    ">

      <h2 style="
        margin-bottom:25px;
        color:#222;
      ">
        Your OTP Code
      </h2>

      <div>
        ${digits}
      </div>

      <p style="
        margin-top:25px;
        color:#777;
        font-size:14px;
      ">
        This OTP will expire soon.
      </p>

    </div>

  </div>

</body>
</html>
`;
}


module.exports = {generateOTP, getOTP}