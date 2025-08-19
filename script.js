
getLocation()
let lat, lon
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      lat = position.coords.latitude
      lon = position.coords.longitude
      //แสดง lat long ใน textbox
      document.getElementById("latlong").value = lat + ',' + lon;
    });
  }
}


const GAS_URL = "https://script.google.com/macros/s/AKfycbzHh2whTRjedoCy-5NPwL1gvuCqSDLASRIFdjurzTQOBJux4bI7rTj8wUh5dWWn6xJi-Q/exec"; // แทนที่ด้วย URL จริงจาก GAS
let mapId = '';
let mapUrl = '';
let phonenetwork = '';

async function loadMap(lat, lon) {
  // ✅ ถ้ามีข้อมูล map อยู่แล้ว ให้ return เลย
  if (mapUrl && mapId) {
    //console.log("ใช้ข้อมูลแผนที่ที่โหลดไว้แล้ว");
    return { mapId, mapUrl };
  }
  else {
    const response = await fetch(`${GAS_URL}?getMap=true&latitude=${lat}&longitude=${lon}`);
    const data = await response.json();
    if (data && data.fileUrl) {
      // ✅ บันทึกค่าที่ได้
      mapId = data.fileId;
      mapUrl = data.fileUrl;
    }
    return { mapId, mapUrl };
  }
}


async function Checknetwork(phoneno) {
  try {
    const response = await fetch(`${GAS_URL}?phone=${phoneno}`);

    if (!response.ok) {
      return '❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
    }

    const text = await response.text(); // ✅ อ่านเป็นข้อความธรรมดา

    if (text.trim()) {
      return `📞 ผลการตรวจสอบ:\n${text}`;
    } else {
      return 'ไม่พบข้อมูลเบอร์โทรนี้';
    }

  } catch (error) {
    return '⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ API';
  }
}



function validateThaiID(id) {
  // ตรวจสอบความยาวของเลขบัตรประชาชน
  if (id.length !== 13) {
    return false;
  }
  // ตรวจสอบว่าเป็นตัวเลขทั้งหมดหรือไม่
  if (!/^\d{13}$/.test(id)) {
    return false;
  }
  // คำนวณเช็คดิจิตอล
  var sum = 0;
  for (var i = 0; i < 12; i++) {
    sum += parseInt(id.charAt(i)) * (13 - i);
  }
  var checkDigit = (11 - (sum % 11)) % 10;
  // เปรียบเทียบเช็คดิจิตอล
  return parseInt(id.charAt(12)) === checkDigit;
}


async function settext() {
  let user = document.getElementById("user").value;
  let datetimeInput = document.getElementById("datetime");
  let datetime = datetimeInput.value ? new Date(datetimeInput.value) : new Date();
  let detail = document.getElementById("detail").value;
  let latlong = document.getElementById("latlong").value;
  let options = { year: 'numeric', month: 'short', day: 'numeric' };
  let thaiDate = datetime.toLocaleDateString('th-TH', options);
  let mapLink = "https://maps.google.com?q=" + latlong;
  let qrurl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(mapLink);
  let message = 'เรียน ผู้บังคับบัญชา\n-------------------------\n     วันนี้( ' + thaiDate + ' )\n' + user + ' ' + detail + '\nแผนที่: ' + mapLink + '\n     จึงเรียนมาเพื่อโปรดทราบ';
  // 👇 รอให้โหลดภาพแผนที่เสร็จ
  var latitude = parseFloat(latlong.split(',')[0])
  var longitude = parseFloat(latlong.split(',')[1])

  const { mapId, mapUrl } = await loadMap(latitude, longitude);

  return { message, mapLink, qrurl, mapId, mapUrl };
}

// ฟังก์ชันดึงข้อมูล IP
async function getIPFromAPI(userip) {
  try {
    const apiUrl = `http://ip-api.com/json/${userip}`;
    const response = await fetch(apiUrl);

    if (response.ok) {
      const data = await response.json();

      if (data.status === "success") {
        return [
          `IP Address: ${data.query}`,
          `📍ประเทศ: ${data.country} (${data.countryCode})`,
          `📍พื้นที่: ${data.region} (${data.regionName})`,
          `📍เมือง: ${data.city}`,
          `📍Timezone: ${data.timezone}`,
          `📍ผู้ให้บริการ: ${data.isp}`,
          `📍Org: ${data.org}`,
          `📍As: ${data.as}`,
          `📍Google Maps: <a href="https://maps.google.com?q=${data.lat},${data.lon}" target="_blank">ดูในแผนที่</a>`
        ].join('<br>');
      } else {
        return `ไม่สามารถดึงข้อมูล IP ได้: ${data.message}`;
      }
    } else {
      return `ไม่สามารถเชื่อมต่อ API ได้: Response code ${response.status}`;
    }
  } catch (error) {
    return `เกิดข้อผิดพลาด: ${error.message}`;
  }
}



async function showResult() {
  Swal.fire({
    title: 'กรุณารอสักครู่...',
    text: 'กำลังสร้างแผนที่และส่งข้อมูล',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const { message, mapLink, qrurl, mapId, mapUrl } = await settext();
    // แสดงข้อมูลในหน้าเว็บ
    document.getElementById("showResultmap").style.display = "block";
    document.getElementById("resultMessage").textContent = message;
    document.getElementById("mapLink").href = mapLink;
    document.getElementById("mapLink").textContent = mapLink;
    document.getElementById("qrImage").src = qrurl;
    document.getElementById("map-img").src = 'https://lh3.googleusercontent.com/d/' + mapId;
    Swal.close(); // ปิดแจ้งเตือนเมื่อเสร็จ
    Swal.fire({
      icon: 'success',
      title: 'ส่งข้อมูลสำเร็จ!',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    Swal.close(); // ปิด loading
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message || 'ไม่สามารถส่งข้อมูลได้'
    });
  }
}

// ฟังก์ชันสำหรับแสดงข้อมูลในหน้า LIFF
function displayInfo(info) {
  // ให้ result โผล่มา
    document.getElementById('result').classList.remove('hidden');
    // แสดงข้อความ
    document.getElementById("statusMessage").innerHTML = info
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("btnsettext").addEventListener("click", function () {
    showResult()
  });

  document.getElementById("btnsendrp").addEventListener("click", function () {
    handleSend()
  });

  document.getElementById("btnShare").addEventListener("click", async function () {
    Swal.fire({
      title: 'กรุณารอสักครู่...',
      text: 'กำลังสร้างแผนที่และส่งข้อมูล',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    try {
      const content = await settext();      // โหลดข้อมูล
      await shareMessage(content.message, content.mapLink, content.qrurl, content.mapUrl);
      Swal.close();// ปิดแจ้งเตือนเมื่อเสร็จ
      Swal.fire({
        icon: 'success',
        title: 'ส่งข้อมูลสำเร็จ!',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      Swal.close(); // ปิด loading
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถส่งข้อมูลได้'
      });
    }
  });

  document.getElementById("btncheckip").addEventListener("click", async function () {
    var ip = document.getElementById("txtip").value;
    if (ip !== '') {
      try {
        const ipInfo = await getIPFromAPI(ip); // ได้ข้อมูลจาก API
        displayInfo(ipInfo);                   // ส่งค่าเข้า displayInfo อย่างถูกต้อง
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.message || 'ไม่สามารถดึงข้อมูล IP ได้'
        });
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอก IP Address ให้ถูกต้อง'
      });
    }
  });

  document.getElementById("btnidcheck").addEventListener("click", function () {
    var thaiID = document.getElementById("txtid").value;
    if (validateThaiID(thaiID)) {
      sendMessagebot('Id#' + thaiID);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกหมายเลขบัตรประชาชนให้ถูกต้อง'
      });
    }
  });

  document.getElementById("txtid").addEventListener("input", function () {
    var thaiID = document.getElementById("txtid").value;
    var resultElement = document.getElementById("idcheck");
    if (validateThaiID(thaiID)) {
      resultElement.innerText = "✅";
    } else {
      resultElement.innerText = "❌";
    }
  });

  document.getElementById("btncheckphone").addEventListener("click", async function () {
    const phone = document.getElementById("txtphone").value;
    if (phone !== '') {
      try {
        const info = await Checknetwork(phone);
        displayInfo(info); // ส่งค่าเข้า displayInfo อย่างถูกต้อง
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.message || 'ไม่สามารถดึงข้อมูลเครือข่ายได้'
        });
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกหมายเลขโทรศัพท์ให้ถูกต้อง'
      });
    }
  });
});


async function shareMessage(message, mapLink, qrurl, mapUrl) {
  const result = await liff.shareTargetPicker([
    {
      type: 'text',
      text: message
    },
    {
      type: 'location',
      title: 'ตำแหน่งที่แจ้ง',
      address: 'ดูบน Google Maps',
      latitude: parseFloat(mapLink.split('=')[1].split(',')[0]),
      longitude: parseFloat(mapLink.split('=')[1].split(',')[1])
    },
    {
      type: 'image',
      originalContentUrl: qrurl,
      previewImageUrl: qrurl
    },
    {
      type: 'image',
      originalContentUrl: mapUrl,
      previewImageUrl: mapUrl
    }
  ])

  if (result) {
    alert(`[${result.status}] Message sent!`)
  } else {
    const [majorVer, minorVer, patchVer] = (liff.getLineVersion() || "").split('.');
    if (minorVer === undefined) {
      alert('ShareTargetPicker was canceled in external browser')
    }
    if (parseInt(majorVer) >= 10 && parseInt(minorVer) >= 10 && parseInt(patchVer) > 0) {
      alert('ShareTargetPicker was canceled in LINE app')
    }
  }
}

async function sendMapQr({ message, qrurl, mapUrl }) {
  try {
    await liff.sendMessages([
      {
        type: 'text',
        text: message
      },
      /*{
        type: 'location',
        title: 'ตำแหน่งที่แจ้ง',
        address: 'ดูบน Google Maps',
        latitude: parseFloat(mapLink.split('=')[1].split(',')[0]),
        longitude: parseFloat(mapLink.split('=')[1].split(',')[1])
      },*/
      {
        type: 'image',
        originalContentUrl: qrurl,
        previewImageUrl: qrurl
      },
      {
        type: 'image',
        originalContentUrl: mapUrl,
        previewImageUrl: mapUrl
      }
    ]);
    alert("ส่งข้อความสำเร็จ!");
    liff.closeWindow();
  } catch (error) {
    alert("เกิดข้อผิดพลาดในการส่งข้อความ: " + error);
  }
}

// แสดงแจ้งเตือนระหว่างประมวลผล
async function handleSend() {
  Swal.fire({
    title: 'กรุณารอสักครู่...',
    text: 'กำลังสร้างแผนที่และส่งข้อมูล',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
  try {

    const content = await settext();      // โหลดข้อมูล
    await sendMapQr(content);// ส่งข้อความไป LINE
    Swal.close();// ปิดแจ้งเตือนเมื่อเสร็จ

    Swal.fire({
      icon: 'success',
      title: 'ส่งข้อมูลสำเร็จ!',
      timer: 2000,
      showConfirmButton: false
    });

  } catch (error) {
    Swal.close(); // ปิด loading
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message || 'ไม่สามารถส่งข้อมูลได้'
    });
  }
}


async function sendMessagebot(message) {
  try {
    // เรียกใช้ LIFF API เพื่อส่งข้อความ
    await liff.sendMessages([
      {
        type: 'text',
        text: message, // ข้อความที่ต้องการส่ง
      }
      // สามารถเพิ่มประเภทของข้อความและข้อมูลเพิ่มเติมตามต้องการ
    ]);
    alert("Message sent successfully!");
    liff.closeWindow();
  } catch (error) {
    alert("Error occurred while trying to send message:", error);
  }
}


function logOut() {
  liff.logout()
  window.location.reload()
}

async function getUserProfile() {
  try {
    const profile = await liff.getProfile();
    const pictureUrl = document.getElementById("pictureUrl");
    const userId = document.getElementById("userId");
    const displayName = document.getElementById("displayName");
    const statusMessage = document.getElementById("statusMessage");
    const email = document.getElementById("email");

    pictureUrl.src = profile.pictureUrl;
    displayName.innerHTML = profile.displayName;
    userId.innerHTML = profile.userId ?? '';
    email.innerHTML = liff.getDecodedIDToken().email ?? '';
    statusMessage.innerHTML = profile.statusMessage ?? '';
  } catch (error) {
    console.error("Error occurred while trying to get user profile:", error);
  }
}


async function handleLogin() {
  if (liff.isLoggedIn()) {
    getUserProfile()
    document.getElementById("btnLogin").style.display = "none";
  } else if (!liff.isLoggedIn()) {
    //alert("Login failed. Please try again.");
    //liff.login({ redirectUri: "https://sankunakorn.github.io/sanbot-liff/" })
    document.getElementById("btnLogin").style.display = "block";
    document.getElementById("btnLogOut").style.display = "none";
  }
}


async function initializeLiff() {
  try {
    // Initialize LIFF
    await liff.init({ liffId: "2004593216-XbA9wj26" }).then(() => {
      //withLoginOnExternalBrowser: true,
      handleLogin();
      liff.ready.then(() => {
        if (liff.getOS() === "android") {
          body.style.backgroundColor = "#98FB98";
          os.innerHTML = 'OS:' + liff.getOS()
        }
        else if (liff.getOS() === "web") {
          body.style.backgroundColor = "#99CCFF";
          os.innerHTML = 'OS:' + liff.getOS()
        }
        else if (liff.getOS() === "ios") {
          body.style.backgroundColor = "#F8F8FF";
          os.innerHTML = 'OS:' + liff.getOS()
        }
        if (liff.isInClient() && userAgent.includes("Line")) {
          //inapp.innerHTML = 'Line';
        }
        else if (!liff.isInClient()) {
          //inapp.innerHTML = 'ExternalBrowser';
        }
      })
    })
  }
  catch (error) {
    // Handle initialization errors
    alert('LIFF initialization failed', error);
    //alert("LIFF initialization failed. Please try again later.");
  }
}





