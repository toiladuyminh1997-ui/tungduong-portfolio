// ============================================================
//  DỮ LIỆU PORTFOLIO — sửa nội dung web ở file này
//  (tên dự án, giới thiệu, liên hệ). Không cần đụng main.js.
// ============================================================

export const PROFILE = {
  name: "Nguyễn Tùng Dương",
  nameShort: "TÙNG DƯƠNG",
  role: "Motion Designer & Video Creator",
  roleLine: "Motion Designer at Fratoz · Freelance with The Industree",
  location: "Vietnam",
  timezone: "Asia/Ho_Chi_Minh",
  photo: "assets/duong.jpg",
  // Giới thiệu — viết ngôi thứ nhất, sửa tuỳ ý
  intro:
    "I'm Nguyễn Tùng Dương, a motion designer at Fratoz who also freelances with The Industree. I turn still key visuals into living campaigns: logos that breathe, KV built for giant LED walls and event backdrops, and edits cut for the vertical feed.",
  bioVi:
    "Mình là Nguyễn Tùng Dương, sinh năm 2001, hiện làm motion designer tại Fratoz và freelance cùng The Industree. Mình biến những key visual tĩnh thành chiến dịch có nhịp sống: logo chuyển động, KV cho màn LED và backdrop sự kiện, và những bản dựng cho mạng xã hội.",
  services: ["Visual / 3D Motion", "Logo Animation", "KV Animation", "LED & Backdrop Content", "Video Editing", "Social Cutdowns"],
  // Thông tin cá nhân (hiện ở mục About)
  facts: [
    ["Born", "14.11.2001"],
    ["Based in", "Vietnam"],
    ["Currently", "Motion Designer — Fratoz"],
    ["Freelance", "The Industree"],
  ],
  email: "xiaoduong141101@gmail.com",
  phone: "0985 142 418",
  phoneLink: "+84985142418",
  socials: [
    { label: "Behance", url: "#" },
    { label: "Instagram", url: "#" },
    { label: "Facebook", url: "#" },
  ],
};

// Hero animation render từ "ran trai tim 5.blend"
export const HERO = {
  video: "media/hero/hero_1080.mp4",
  videoMobile: "media/hero/hero_720.mp4",
  poster: "media/hero/hero_poster.jpg",
};

// 4 mục chính. "cover" = số thứ tự clip dùng làm preview khi hover.
export const CATEGORIES = [
  {
    id: "visual",
    title: "Visual",
    sub: "3D · CGI · Motion visuals",
    desc: "Cinematic visuals, 3D looks and mood pieces — light, material and motion first.",
    cover: 0,
    items: [
      ["Visual 01", "visual/01-1"],
      ["Visual 02", "visual/02-2"],
      ["Visual 03", "visual/03-3-2"],
      ["Visual 04", "visual/04-4"],
      ["Visual 05", "visual/05-5"],
      ["Visual 08", "visual/06-8"],
      ["Visual 09", "visual/07-9"],
      ["Visual 10", "visual/08-10"],
      ["Color", "visual/09-color"],
      ["Countdown", "visual/10-countdown"],
      ["Thể Dục Thể Thao", "visual/11-the-duc-the-thao"],
      ["The Kollab — New Year", "visual/12-the-kollab-new-year"],
    ],
  },
  {
    id: "logo",
    title: "Logo Animation",
    sub: "Brand reveals · Idents",
    desc: "Short, sharp brand reveals — where a mark gets its first heartbeat.",
    cover: 1,
    items: [
      ["HVCN", "logo/01-ani-hvcn-ren"],
      ["HCC", "logo/02-hcc-animaiton"],
      ["Atable", "logo/03-logo-atable-animation"],
      ["Xèo Xèo", "logo/04-xeoxeo-final2"],
    ],
  },
  {
    id: "kv",
    title: "KV Animation",
    sub: "Key visual · LED · Backdrop",
    desc: "Key visuals brought to life for LED walls, elevator screens, stage backdrops and campaigns.",
    cover: 21,
    items: [
      ["KV 01", "kv/01-1"],
      ["Backdrop 8×5m — A", "kv/02-8m-x-5m-1"],
      ["Backdrop 8×5m — B", "kv/03-8m-x-5m"],
      ["KV 1920 — A", "kv/04-1920x1080-1"],
      ["KV 1920 — B", "kv/05-1920x1080"],
      ["Techcombank 5/9", "kv/06-animation-techcombank-5-9"],
      ["Backdrop 02", "kv/07-backdrop-2"],
      ["Backdrop 03", "kv/08-backdrop-1"],
      ["Backdrop 01", "kv/09-backdrop"],
      ["Duy Mạnh", "kv/10-kv-duy-manh-animation"],
      ["KV Panorama", "kv/11-kv"],
      ["Song Tinh", "kv/12-kv-song-tinh-ren-test"],
      ["LED Thang Máy Nội Bài", "kv/13-led-thang-may-noi-bai-fn"],
      ["Lê Hiếu", "kv/14-le-hieu-kv-co-nhac-1080x1920"],
      ["Elevator Screen Ads", "kv/15-quang-cao-he-thong-man-hinh-thang-may-ta"],
      ["Task 56", "kv/16-task-56-1920-3840-ngang"],
      ["Task 76", "kv/17-task-76-1920-1080-2"],
      ["Task 147", "kv/18-task-147"],
      ["Task 151 — Loop", "kv/19-task-151loop"],
      ["Task 293", "kv/20-task-293-2560-x-896"],
      ["Task 325", "kv/21-task-325"],
      ["Techcombank × Starbucks", "kv/22-tcb-starbuck-10s-1920x1080"],
      ["VMH", "kv/23-vmh-fn"],
    ],
  },
  {
    id: "edit",
    title: "Video Editor",
    sub: "Edit · Social · Vertical",
    desc: "Rhythm, pacing and story — edits made for the scroll.",
    cover: 0,
    items: [
      ["Jadify", "edit/01-anmation-binh-jadify"],
      ["Social Cut 01", "edit/02-gif-1-doc"],
      ["Social Cut 02", "edit/03-gif-2-doc"],
      ["Social Cut 03", "edit/04-gif-3-doc"],
    ],
  },
];
