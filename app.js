const $=s=>document.querySelector(s);
const DATA_KEY="coffee_erp_data_v2";
const MATERIAL_KEY="coffee_erp_materials_v2";
const workDate=$("#workDate"),toast=$("#toast");
workDate.value=new Date().toISOString().slice(0,10);

function notify(m){toast.textContent=m;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2200)}
function loadJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}}
function saveJSON(key,v){localStorage.setItem(key,JSON.stringify(v))}
function getMaterials(){let m=loadJSON(MATERIAL_KEY,null);if(!m){m=DEFAULT_MATERIALS;saveJSON(MATERIAL_KEY,m)}return m}
function setMaterials(m){saveJSON(MATERIAL_KEY,m)}
function getAllData(){return loadJSON(DATA_KEY,{})}
function setAllData(v){saveJSON(DATA_KEY,v)}
function num(v){const x=Number(String(v??"").replace(",","."));return Number.isFinite(x)?x:0}
function fmt(v){return Number.isInteger(v)?String(v):v.toFixed(2)}
function emptyRow(){return{upStartPacks:"",upInPacks:"",downToBarPacks:"",barStartGross:"",barEndGross:"",note:""}}
function getDay(){
  const all=getAllData(),date=workDate.value;
  if(!all[date])all[date]={};
  getMaterials().forEach(m=>{if(!all[date][m.code])all[date][m.code]=emptyRow()});
  return{all,day:all[date]}
}
function netFromGross(gross,m){return Math.max(0,num(gross)-num(m.tareWeight))}
function packsToBase(packs,m){return num(packs)*num(m.packSize)}
function activeMaterials(){return getMaterials().filter(m=>m.active)}
function filteredMaterials(){
  const q=$("#searchInput").value.toLowerCase().trim(),g=$("#groupFilter").value;
  return activeMaterials().filter(m=>(!g||m.group===g)&&(!q||`${m.code} ${m.name}`.toLowerCase().includes(q)))
}
function previousDate(date){const d=new Date(date+"T00:00:00");d.setDate(d.getDate()-1);return d.toISOString().slice(0,10)}
function carryPrevious(silent=false){
  const all=getAllData(),date=workDate.value,prev=previousDate(date),mats=activeMaterials();
  if(!all[prev]){if(!silent)notify("Chưa có dữ liệu ngày trước");return false}
  if(!all[date])all[date]={};
  mats.forEach(m=>{
    const p=all[prev][m.code]||emptyRow(),cur=all[date][m.code]||emptyRow();
    const upEndPacks=num(p.upStartPacks)+num(p.upInPacks)-num(p.downToBarPacks);
    cur.upStartPacks=String(Math.max(0,upEndPacks));
    cur.barStartGross=p.barEndGross||"";
    all[date][m.code]=cur
  });
  setAllData(all);if(!silent)notify("Đã lấy tồn cuối ngày trước");return true
}
function autoCarryIfEmpty(){
  const {day}=getDay();
  const hasAny=Object.values(day).some(r=>Object.values(r).some(v=>String(v)!==""));
  if(!hasAny)carryPrevious(true)
}
function render(){
  autoCarryIfEmpty();
  const{day}=getDay(),mats=filteredMaterials();
  $("#employeeTable").innerHTML=`<thead><tr>
    <th>Mã</th><th>Nhóm</th><th>Tên nguyên liệu</th><th>Đơn vị kho</th>
    <th>Tồn đầu kho</th><th>Nhập kho</th><th>Xuất kho</th>
    <th>Vỏ</th><th>Tồn lẻ cuối ngày</th><th>Ghi chú</th>
  </tr></thead><tbody>${mats.map(m=>{
    const r=day[m.code];
    return `<tr data-code="${m.code}">
      <td data-label="Mã">${m.code}</td>
      <td data-label="Nhóm">${m.group}</td>
      <td data-label="Tên nguyên liệu" class="name">${m.name}</td>
      <td data-label="Đơn vị kho">${m.stockUnit}</td>
      <td data-label="Tồn đầu kho" class="input-cell"><input type="number" min="0" step="0.01" data-field="upStartPacks" value="${r.upStartPacks}"></td>
      <td data-label="Nhập kho" class="input-cell"><input type="number" min="0" step="0.01" data-field="upInPacks" value="${r.upInPacks}"></td>
      <td data-label="Xuất kho" class="input-cell"><input type="number" min="0" step="0.01" data-field="downToBarPacks" value="${r.downToBarPacks}"></td>
      <td data-label="Vỏ">${fmt(num(m.tareWeight))} ${m.baseUnit}</td>
      <td data-label="Tồn lẻ cuối ngày" class="input-cell"><input type="number" min="0" step="0.01" data-field="barEndGross" value="${r.barEndGross}" placeholder="Cân cả vỏ"></td>
      <td data-label="Ghi chú" class="input-cell"><textarea data-field="note" placeholder="Hư, đổ, hết hạn...">${r.note||""}</textarea></td>
    </tr>`}).join("")}</tbody>`;

  let totals={in:0,out:0,use:0,low:0,negative:0};
  $("#bossTable").innerHTML=`<thead><tr>
    <th>Mã</th><th>Tên nguyên liệu</th><th>ĐVT lẻ</th>
    <th>Tồn đầu kho</th><th>Nhập kho</th><th>Xuất quầy</th><th>Tồn cuối kho</th>
    <th>Quầy đầu thực</th><th>Nhận xuống quầy</th><th>Quầy cuối thực</th>
    <th>Tiêu hao/Bán ra</th><th>Tồn tổng cuối</th><th>Cảnh báo</th>
  </tr></thead><tbody>${mats.map(m=>{
    const r=day[m.code];
    const upStart=packsToBase(r.upStartPacks,m),upIn=packsToBase(r.upInPacks,m),down=packsToBase(r.downToBarPacks,m);
    const upEnd=upStart+upIn-down,startNet=netFromGross(r.barStartGross,m),endNet=netFromGross(r.barEndGross,m);
    const use=startNet+down-endNet,totalEnd=upEnd+endNet,low=totalEnd<num(m.minStock),neg=upEnd<0||use<0;
    totals.in+=upIn;totals.out+=down;totals.use+=use;if(low)totals.low++;if(neg)totals.negative++;
    return `<tr>
      <td>${m.code}</td><td class="name">${m.name}</td><td>${m.baseUnit}</td>
      <td>${fmt(upStart)}</td><td>${fmt(upIn)}</td><td>${fmt(down)}</td>
      <td class="calc ${upEnd<0?"negative":""}">${fmt(upEnd)}</td>
      <td>${fmt(startNet)}</td><td>${fmt(down)}</td><td>${fmt(endNet)}</td>
      <td class="consumption ${use<0?"negative":""}">${fmt(use)}</td>
      <td class="${low?"low-stock":""}">${fmt(totalEnd)}</td>
      <td>${neg?"Âm bất thường":low?"Sắp hết":"Ổn"}</td>
    </tr>`}).join("")}</tbody>`;
  $("#summaryCards").innerHTML=`
    <div class="card"><span>Tổng nhập kho (đơn vị lẻ)</span><strong>${fmt(totals.in)}</strong></div>
    <div class="card"><span>Tổng xuất xuống quầy</span><strong>${fmt(totals.out)}</strong></div>
    <div class="card"><span>Tổng tiêu hao</span><strong>${fmt(totals.use)}</strong></div>
    <div class="card"><span>Sắp hết / Bất thường</span><strong>${totals.low} / ${totals.negative}</strong></div>`;
  renderMaterials();
}
function saveCurrent(){
  const{all,day}=getDay();
  $("#employeeTable").querySelectorAll("tbody tr").forEach(tr=>{
    const code=tr.dataset.code;
    tr.querySelectorAll("[data-field]").forEach(el=>day[code][el.dataset.field]=el.value)
  });
  all[workDate.value]=day;setAllData(all);render();notify("Đã lưu dữ liệu")
}
function renderMaterials(){
  const mats=getMaterials();
  $("#materialsTable").innerHTML=`<thead><tr>
    <th>Mã</th><th>Nhóm</th><th>Tên nguyên liệu</th><th>ĐVT kho</th><th>ĐVT lẻ</th>
    <th>Khối lượng tịnh</th><th>Khối lượng vỏ</th><th>Tồn tối thiểu</th><th>Trạng thái</th><th>Thao tác</th>
  </tr></thead><tbody>${mats.map(m=>`<tr>
    <td>${m.code}</td><td>${m.group}</td><td class="name">${m.name}</td><td>${m.stockUnit}</td><td>${m.baseUnit}</td>
    <td>${fmt(num(m.packSize))}</td><td>${fmt(num(m.tareWeight))}</td><td>${fmt(num(m.minStock))}</td>
    <td>${m.active?"Đang sử dụng":"Ngừng dùng"}</td>
    <td><div class="action-row">
      <button class="small-btn edit" onclick="editMaterial('${m.code}')">Sửa</button>
      <button class="small-btn toggle" onclick="toggleMaterial('${m.code}')">${m.active?"Ngừng":"Bật"}</button>
      <button class="small-btn delete" onclick="deleteMaterial('${m.code}')">Xóa</button>
    </div></td>
  </tr>`).join("")}</tbody>`;
  const active=mats.filter(m=>m.active).length,inactive=mats.length-active,withTare=mats.filter(m=>num(m.tareWeight)>0).length;
  $("#materialStats").innerHTML=`
    <div class="stat"><span>Tổng nguyên liệu</span><strong>${mats.length}</strong></div>
    <div class="stat"><span>Đang sử dụng</span><strong>${active}</strong></div>
    <div class="stat"><span>Ngừng sử dụng</span><strong>${inactive}</strong></div>
    <div class="stat"><span>Có khai báo vỏ</span><strong>${withTare}</strong></div>`;
  rebuildGroupFilter();
}
function openModal(code=null){
  const mats=getMaterials(),m=code?mats.find(x=>x.code===code):null;
  $("#modalTitle").textContent=m?"Sửa nguyên liệu":"Thêm nguyên liệu";
  $("#editingCode").value=m?.code||"";
  $("#mCode").value=m?.code||"";$("#mCode").disabled=!!m;
  $("#mGroup").value=m?.group||"";$("#mName").value=m?.name||"";
  $("#mStockUnit").value=m?.stockUnit||"";$("#mBaseUnit").value=m?.baseUnit||"g";
  $("#mPackSize").value=m?.packSize??"";$("#mTareWeight").value=m?.tareWeight??0;
  $("#mMinStock").value=m?.minStock??0;$("#mActive").value=String(m?.active??true);
  $("#materialModal").classList.add("show")
}
function closeModal(){$("#materialModal").classList.remove("show")}
window.editMaterial=code=>openModal(code);
window.toggleMaterial=code=>{const mats=getMaterials(),m=mats.find(x=>x.code===code);m.active=!m.active;setMaterials(mats);render();notify("Đã cập nhật trạng thái")};
window.deleteMaterial=code=>{
  if(!confirm("Xóa nguyên liệu này? Dữ liệu kiểm kê cũ vẫn còn trong bộ nhớ."))return;
  setMaterials(getMaterials().filter(m=>m.code!==code));render();notify("Đã xóa nguyên liệu")
};
function rebuildGroupFilter(){
  const current=$("#groupFilter").value,groups=[...new Set(activeMaterials().map(m=>m.group))].sort();
  $("#groupFilter").innerHTML='<option value="">Tất cả nhóm hàng</option>'+groups.map(g=>`<option value="${g}">${g}</option>`).join("");
  if(groups.includes(current))$("#groupFilter").value=current
}
$("#materialForm").onsubmit=e=>{
  e.preventDefault();
  const mats=getMaterials(),editing=$("#editingCode").value,code=$("#mCode").value.trim().toUpperCase();
  if(!editing&&mats.some(m=>m.code===code))return notify("Mã nguyên liệu đã tồn tại");
  const data={code,group:$("#mGroup").value.trim(),name:$("#mName").value.trim(),stockUnit:$("#mStockUnit").value.trim(),baseUnit:$("#mBaseUnit").value,packSize:num($("#mPackSize").value),tareWeight:num($("#mTareWeight").value),minStock:num($("#mMinStock").value),active:$("#mActive").value==="true"};
  if(editing){const i=mats.findIndex(m=>m.code===editing);mats[i]=data}else mats.push(data);
  setMaterials(mats);closeModal();render();notify("Đã lưu nguyên liệu")
};
function exportData(){
  const payload={materials:getMaterials(),inventory:getAllData()};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`coffee-erp-${workDate.value}.json`;a.click();URL.revokeObjectURL(a.href)
}
function importData(file){
  const rd=new FileReader();rd.onload=()=>{try{const p=JSON.parse(rd.result);if(p.materials)setMaterials(p.materials);if(p.inventory)setAllData(p.inventory);render();notify("Đã nhập dữ liệu")}catch{notify("File JSON không hợp lệ")}};rd.readAsText(file)
}
document.querySelectorAll(".nav-item").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");$("#"+btn.dataset.view+"View").classList.add("active");
  const map={employee:["Kiểm soát hàng hóa 2 kho","Nhân viên nhập số liệu thực tế."],boss:["Báo cáo quản lý","Tự tính tồn kho, hàng lẻ và tiêu hao."],materials:["Danh mục nguyên vật liệu","Quản lý quy cách, vỏ hộp và trạng thái sử dụng."]};
  $("#pageTitle").textContent=map[btn.dataset.view][0];$("#pageSubtitle").textContent=map[btn.dataset.view][1];
  $("#inventoryToolbar").style.display=btn.dataset.view==="materials"?"none":"flex";
  $(".hero-actions").style.display=btn.dataset.view==="materials"?"none":"flex";render()
});
$("#saveBtn").onclick=saveCurrent;$("#autoCarryBtn").onclick=()=>carryPrevious(false);
$("#exportBtn").onclick=exportData;$("#importInput").onchange=e=>e.target.files[0]&&importData(e.target.files[0]);$("#printBtn").onclick=()=>window.print();
workDate.onchange=render;$("#searchInput").oninput=render;$("#groupFilter").onchange=render;
$("#addMaterialBtn").onclick=()=>openModal();$("#closeModalBtn").onclick=closeModal;$("#cancelModalBtn").onclick=closeModal;
$("#materialModal").onclick=e=>{if(e.target.id==="materialModal")closeModal()};
rebuildGroupFilter();render();
