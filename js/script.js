
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
    checkIP();//
  });

  document.getElementById("btnidcheck").addEventListener("click", function () {
    checkIDCard();
  });

  document.getElementById("txtid").addEventListener("input", function () {
    validateIDCard();
  });

  document.getElementById("btncheckphone").addEventListener("click", async function () {
    checkPhone();
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


// ========================================
// AUTHENTICATION
// ========================================
function logOut() {
  Swal.fire({
    icon: 'question',
    title: 'ออกจากระบบ?',
    text: 'คุณต้องการออกจากระบบหรือไม่?',
    showCancelButton: true,
    confirmButtonText: 'ออกจากระบบ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280'
  }).then((result) => {
    if (result.isConfirmed) {
      liff.logout();
      window.location.reload()
      Swal.fire({
        icon: 'success',
        title: 'ออกจากระบบแล้ว',
        confirmButtonColor: '#1e3a8a'
      });
    }
  });
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

initializeLiff()
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


// ========================================
// PAGE NAVIGATION
// ========================================
function showPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page-content').forEach(page => {
    page.classList.add('hidden');
  });
  // Show selected page
  document.getElementById('page-' + pageName).classList.remove('hidden');
  // Update navigation buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.closest('.nav-btn').classList.add('active');
  clearResult();
  clearInputs();

}

// ========================================
// SEARCH TAB SWITCHING
// ========================================
function switchSearchTab(tabName) {
  // Hide all search content
  document.querySelectorAll('.search-content').forEach(content => {
    content.classList.add('hidden');
  });
  // Show selected search content
  document.getElementById('search-' + tabName).classList.remove('hidden');
  // Update tab buttons
  document.querySelectorAll('.search-tab').forEach(btn => {
    btn.classList.remove('active');
    btn.classList.add('bg-white', 'text-gray-700');
    btn.classList.remove('text-white');
  });
  const activeTab = document.getElementById('tab-' + tabName);
  activeTab.classList.add('active');
  clearResult();
  clearInputs();

  // Apply specific colors for active tab
  if (tabName === 'phone') {
    activeTab.classList.remove('bg-white', 'text-gray-700');
    activeTab.classList.add('bg-gradient-to-r', 'from-green-500', 'to-green-600', 'text-white', 'shadow-xl', 'scale-105');
  } else if (tabName === 'ip') {
    activeTab.classList.remove('bg-white', 'text-gray-700');
    activeTab.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-blue-600', 'text-white', 'shadow-xl', 'scale-105');
  } else if (tabName === 'idcard') {
    activeTab.classList.remove('bg-white', 'text-gray-700');
    activeTab.classList.add('bg-gradient-to-r', 'from-purple-500', 'to-purple-600', 'text-white', 'shadow-xl', 'scale-105');
  }
}


// ฟังก์ชันเคลียร์ผลลัพธ์
function clearResult() {
  const resultDiv = document.getElementById('result');
  const statusMessage = document.getElementById('statusMessage');

  resultDiv.classList.add('hidden');
  statusMessage.classList.add('hidden');
  statusMessage.innerHTML = '';
}

// ฟังก์ชันเคลียร์ input fields
function clearInputs() {
  document.getElementById('txtphone').value = '';
  document.getElementById('txtip').value = '';
  document.getElementById('txtid').value = '';
  document.getElementById('idcheck').innerHTML = '';
}



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

function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      document.getElementById('latlong').value = lat + ',' + lng;
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: 'ได้ตำแหน่ง GPS แล้ว',
        confirmButtonColor: '#1e3a8a'
      });
    }, function (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถเข้าถึง GPS ได้',
        confirmButtonColor: '#dc2626'
      });
    });
  }
}

// ========================================
// SEARCH FUNCTIONS (แก้ไขใหม่ - รองรับ API)
// ========================================
// ฟังก์ชันดึงข้อมูล IP จาก API
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
// ฟังก์ชันแสดงผลข้อมูล IP
function displayIPInfo(ipInfo) {
  const resultDiv = document.getElementById('result');
  const statusMessage = document.getElementById('statusMessage');
  statusMessage.innerHTML = `
        <div class="border-l-4 border-blue-500 pl-4">
            <h3 class="text-xl font-bold text-blue-700 mb-4">🌐 ผลการตรวจสอบ IP Address</h3>
            
            <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600 mb-1">IP Address</p>
                    <p class="text-lg font-bold text-blue-900">${ipInfo.query}</p>
                </div>
                
                <div class="bg-green-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600 mb-1">ประเทศ</p>
                    <p class="text-lg font-bold text-green-900">${ipInfo.country} (${ipInfo.countryCode})</p>
                </div>
                
                <div class="bg-purple-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600 mb-1">จังหวัด/รัฐ</p>
                    <p class="text-lg font-bold text-purple-900">${ipInfo.regionName || '-'}</p>
                </div>
                
                <div class="bg-orange-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600 mb-1">เมือง</p>
                    <p class="text-lg font-bold text-orange-900">${ipInfo.city || '-'}</p>
                </div>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <p class="text-sm font-bold text-gray-700 mb-2">📍 พิกัด</p>
                <p class="text-gray-800">Latitude: ${ipInfo.lat}, Longitude: ${ipInfo.lon}</p>
                <a href="https://www.google.com/maps?q=${ipInfo.lat},${ipInfo.lon}" target="_blank" rel="noopener noreferrer" class="inline-block mt-2 text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                    🗺️ เปิดใน Google Maps
                </a>
            </div>
            
            <div class="bg-indigo-50 p-4 rounded-lg mb-4">
                <p class="text-sm font-bold text-indigo-700 mb-2">🌐 ผู้ให้บริการ (ISP)</p>
                <p class="text-gray-800 mb-1"><strong>ISP:</strong> ${ipInfo.isp || '-'}</p>
                <p class="text-gray-800 mb-1"><strong>Organization:</strong> ${ipInfo.org || '-'}</p>
                <p class="text-gray-800"><strong>AS:</strong> ${ipInfo.as || '-'}</p>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
                <p class="text-sm font-bold text-yellow-700 mb-2">🕐 เขตเวลา</p>
                <p class="text-gray-800">${ipInfo.timezone || '-'}</p>
            </div>
        </div>
    `;

  resultDiv.classList.remove('hidden');
  statusMessage.classList.remove('hidden');

  // Scroll to result
  statusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ฟังก์ชัน checkIP ใหม่ที่รองรับ API
async function checkIP() {
  const ip = document.getElementById('txtip').value;
  if (!ip || ip.trim() === '') {
    Swal.fire({
      icon: 'warning',
      title: 'กรุณากรอก IP Address ให้ถูกต้อง',
      confirmButtonColor: '#f59e0b'
    });
    return;
  }

  // แสดง loading
  Swal.fire({
    title: 'กำลังตรวจสอบ...',
    html: 'กรุณารอสักครู่',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const ipInfo = await getIPFromAPI(ip); // ได้ข้อมูลจาก API
    Swal.close();
    displayIPInfo(ipInfo);
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message || 'ไม่สามารถดึงข้อมูล IP ได้',
      confirmButtonColor: '#dc2626'
    });
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

function validateIDCard() {
  const id = document.getElementById('txtid').value;
  const checkDiv = document.getElementById('idcheck');
  if (validateThaiID(id)) {
    checkDiv.innerHTML = '<span class="text-green-500 text-2xl">✅</span>';
  } else if (id.length > 0) {
    checkDiv.innerHTML = '<span class="text-red-500 text-2xl">❌</span>';
  } else {
    checkDiv.innerHTML = '';
  }
}


function checkIDCard() {
  const thaiID = document.getElementById('txtid').value;
  const resultDiv = document.getElementById('result');
  const statusMessage = document.getElementById('statusMessage');

  if (!validateThaiID(thaiID)) {
    Swal.fire({
      icon: 'warning',
      title: 'กรุณากรอกหมายเลขบัตรประชาชนให้ถูกต้อง',
      confirmButtonColor: '#f59e0b'
    });
    return;
  }
  // ส่งข้อความไปยัง Bot
  sendMessagebot('Id#' + thaiID);
  // แสดงผลใน div result
  statusMessage.innerHTML = `
        <div class="border-l-4 border-purple-500 pl-4">
            <h3 class="text-xl font-bold text-purple-700 mb-4">🆔 ผลการตรวจสอบบัตรประชาชน</h3>
            
            <div class="bg-green-50 p-4 rounded-lg mb-4">
                <p class="text-green-800 font-semibold mb-2">✅ หมายเลขบัตรถูกต้อง</p>
                <p class="text-gray-800"><strong>เลขบัตร:</strong> ${thaiID}</p>
            </div>
            
            <div class="bg-blue-50 p-4 rounded-lg mb-4">
                <p class="text-sm font-bold text-blue-700 mb-2">📤 ส่งคำขอตรวจสอบแล้ว</p>
                <p class="text-sm text-blue-600">ระบบได้ส่งคำขอไปยัง Bot เรียบร้อยแล้ว</p>
                <p class="text-sm text-gray-600 mt-2">รหัสคำขอ: Id#${thaiID}</p>
            </div>
            
            <div class="bg-purple-50 p-4 rounded-lg">
                <p class="text-sm text-purple-800">💡 เมื่อเชื่อมต่อ API แล้ว จะแสดงข้อมูล:</p>
                <ul class="text-sm text-purple-700 mt-2 ml-4 list-disc">
                    <li>ชื่อ-นามสกุล</li>
                    <li>วันเกิด อายุ</li>
                    <li>ที่อยู่ตามทะเบียนบ้าน</li>
                    <li>สถานะบัตร (ใช้งานได้/หมดอายุ)</li>
                </ul>
            </div>
        </div>
    `;

  resultDiv.classList.remove('hidden');
  statusMessage.classList.remove('hidden');
  statusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // แสดง Success message
  Swal.fire({
    icon: 'success',
    title: 'ส่งคำขอสำเร็จ',
    text: 'ระบบกำลังตรวจสอบข้อมูล',
    timer: 2000,
    showConfirmButton: false
  });
}



function displaynetwork(info) {
  const resultDiv = document.getElementById('result');
  const statusMessage = document.getElementById('statusMessage');

  statusMessage.innerHTML = `
        <div class="border-l-4 border-green-500 pl-4">
            <h3 class="text-xl font-bold text-green-700 mb-4">📱 ผลการตรวจสอบเบอร์โทร</h3>
            
                <div class="bg-blue-50 p-4 rounded-lg">
                    <p class="text-lg font-bold text-blue-900">${info || 'ไม่ระบุ'}</p>
                </div>
                
            <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-sm text-blue-800">💡 หมายเหตุ: ข้อมูลที่แสดงขึ้นอยู่กับการเชื่อมต่อ API</p>
            </div>
        </div>
    `;

  resultDiv.classList.remove('hidden');
  statusMessage.classList.remove('hidden');
  statusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function checkPhone() {
  const phone = document.getElementById('txtphone').value;

  if (!phone || phone.trim() === '') {
    Swal.fire({
      icon: 'warning',
      title: 'กรุณากรอกหมายเลขโทรศัพท์ให้ถูกต้อง',
      confirmButtonColor: '#f59e0b'
    });
    return;
  }
  // แสดง loading
  Swal.fire({
    title: 'กำลังตรวจสอบ...',
    html: 'กรุณารอสักครู่',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const network = await Checknetwork(phone);
    Swal.close();
    displaynetwork(network);
  } catch (error) {
    Swal.close();
    // แสดงข้อมูล Demo เมื่อ API ไม่พร้อม
    const demoInfo = {
      phone: phone,
      network: 'ตัวอย่าง - ต้องเชื่อมต่อ API',
      type: 'มือถือ',
      status: 'ไม่ทราบ'
    };
    displaynetwork(demoInfo);
    // แสดง warning
    Swal.fire({
      icon: 'info',
      title: 'แสดงข้อมูลตัวอย่าง',
      text: 'ต้องเชื่อมต่อ API เพื่อดูข้อมูลจริง',
      confirmButtonColor: '#3b82f6'
    });
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


// ========================================
// APP FUNCTIONS
// ========================================
function openCustomUrl() {
  const url = document.getElementById('customAppUrl').value;
  if (!url) {
    Swal.fire({
      icon: 'warning',
      title: 'กรุณาใส่ URL',
      text: 'กรุณาใส่ URL ที่ต้องการเปิด',
      confirmButtonColor: '#f59e0b'
    });
    return;
  }

  // Validate URL format
  try {
    const urlObj = new URL(url);
    window.open(url, '_blank', 'noopener,noreferrer');

    Swal.fire({
      icon: 'success',
      title: 'เปิดแล้ว!',
      text: 'เปิดลิงก์ในแท็บใหม่แล้ว',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (e) {
    Swal.fire({
      icon: 'error',
      title: 'URL ไม่ถูกต้อง',
      text: 'กรุณาใส่ URL ที่ถูกต้อง เช่น https://example.com',
      confirmButtonColor: '#dc2626'
    });
  }
}

function showComingSoon(featureName) {
  Swal.fire({
    icon: 'info',
    title: 'เร็วๆ นี้!',
    html: `<p class="text-gray-600">ฟีเจอร์ <strong class="text-police-blue">"${featureName}"</strong> กำลังอยู่ในระหว่างการพัฒนา</p>`,
    confirmButtonColor: '#6366f1',
    confirmButtonText: 'รับทราบ'
  });
}

function openCalculator() {
  Swal.fire({
    icon: 'info',
    title: 'เครื่องคิดเลข',
    text: 'กรุณาเปิดแอพเครื่องคิดเลขในอุปกรณ์ของคุณ หรือใช้เครื่องคิดเลขในเบราว์เซอร์',
    confirmButtonColor: '#14b8a6',
    showCancelButton: true,
    confirmButtonText: 'เปิดออนไลน์',
    cancelButtonText: 'ปิด'
  }).then((result) => {
    if (result.isConfirmed) {
      window.open('https://www.google.com/search?q=calculator', '_blank', 'noopener,noreferrer');
    }
  });
}










