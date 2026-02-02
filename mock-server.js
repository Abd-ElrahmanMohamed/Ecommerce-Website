// 🚀 MOCK SERVER - للتطوير والاختبار فقط
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 💾 In-Memory Database
const users = [
  {
    id: '1',
    firstName: 'احمد',
    lastName: 'محمد',
    email: 'ahmed@example.com',
    phone: '01001234567',
    password: 'password123', // ⚠️ للتطوير فقط
    addresses: [{ id: '1', name: 'المنزل', street: 'شارع النيل', city: 'القاهرة', zip: '11511' }],
    orders: [
      { id: '1', date: '2025-01-20', total: 500, status: 'delivered' },
      { id: '2', date: '2025-01-15', total: 750, status: 'processing' },
    ],
  },
];

const carts = {};
const tokens = {};

// 🔐 Authentication
function generateToken(userId) {
  const token = `token_${userId}_${Date.now()}`;
  tokens[token] = userId;
  return token;
}

function verifyToken(token) {
  return tokens[token];
}

// ✅ API ENDPOINTS

// 1️⃣ LOGIN
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'البريد أو كلمة المرور غير صحيحة' });
  }

  const token = generateToken(user.id);
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    token,
    user: userWithoutPassword,
    message: 'تم تسجيل الدخول بنجاح',
  });
});

// 2️⃣ REGISTER
app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;

  // تحقق من وجود البريد مسبقاً
  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ message: 'البريد مستخدم بالفعل' });
  }

  const newUser = {
    id: `user_${Date.now()}`,
    firstName,
    lastName,
    email,
    phone,
    password,
    addresses: [],
    orders: [],
  };

  users.push(newUser);

  const token = generateToken(newUser.id);
  const { password: _, ...userWithoutPassword } = newUser;

  res.json({
    token,
    user: userWithoutPassword,
    message: 'تم إنشاء الحساب بنجاح',
  });
});

// 3️⃣ GET CART
app.get('/api/cart/:userId', (req, res) => {
  const { userId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token || verifyToken(token) !== userId) {
    return res.status(401).json({ message: 'غير مصرح' });
  }

  const cart = carts[userId] || { items: [], total: 0 };
  res.json(cart);
});

// 4️⃣ ADD TO CART
app.post('/api/cart/:userId/items', (req, res) => {
  const { userId } = req.params;
  const { productId, name, price, quantity, image } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token || verifyToken(token) !== userId) {
    return res.status(401).json({ message: 'غير مصرح' });
  }

  if (!carts[userId]) {
    carts[userId] = { items: [], total: 0 };
  }

  const existingItem = carts[userId].items.find((i) => i.productId === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    carts[userId].items.push({ productId, name, price, quantity, image });
  }

  carts[userId].total = carts[userId].items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  res.json({
    message: 'تم إضافة المنتج',
    cart: carts[userId],
  });
});

// 5️⃣ REMOVE FROM CART
app.delete('/api/cart/:userId/items/:productId', (req, res) => {
  const { userId, productId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token || verifyToken(token) !== userId) {
    return res.status(401).json({ message: 'غير مصرح' });
  }

  if (!carts[userId]) {
    return res.status(404).json({ message: 'السلة غير موجودة' });
  }

  carts[userId].items = carts[userId].items.filter((i) => i.productId !== productId);
  carts[userId].total = carts[userId].items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  res.json({
    message: 'تم حذف المنتج',
    cart: carts[userId],
  });
});

// 6️⃣ UPDATE CART ITEM QUANTITY
app.patch('/api/cart/:userId/items/:productId', (req, res) => {
  const { userId, productId } = req.params;
  const { quantity } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token || verifyToken(token) !== userId) {
    return res.status(401).json({ message: 'غير مصرح' });
  }

  if (!carts[userId]) {
    return res.status(404).json({ message: 'السلة غير موجودة' });
  }

  const item = carts[userId].items.find((i) => i.productId === productId);
  if (item) {
    item.quantity = quantity;
  }

  carts[userId].total = carts[userId].items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  res.json({
    message: 'تم تحديث الكمية',
    cart: carts[userId],
  });
});

// 7️⃣ MERGE CART (بعد تسجيل الدخول)
app.post('/api/cart/:userId/merge', (req, res) => {
  const { userId } = req.params;
  const { items } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token || verifyToken(token) !== userId) {
    return res.status(401).json({ message: 'غير مصرح' });
  }

  if (!carts[userId]) {
    carts[userId] = { items: [], total: 0 };
  }

  items.forEach((newItem) => {
    const existingItem = carts[userId].items.find((i) => i.productId === newItem.productId);
    if (existingItem) {
      existingItem.quantity += newItem.quantity;
    } else {
      carts[userId].items.push(newItem);
    }
  });

  carts[userId].total = carts[userId].items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  res.json({
    message: 'تم دمج السلة',
    cart: carts[userId],
  });
});

// 8️⃣ CLEAR CART
app.delete('/api/cart/:userId', (req, res) => {
  const { userId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token || verifyToken(token) !== userId) {
    return res.status(401).json({ message: 'غير مصرح' });
  }

  carts[userId] = { items: [], total: 0 };
  res.json({ message: 'تم حذف السلة', cart: carts[userId] });
});

// 🏥 HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend Mock Server ✅ جاهز' });
});

// 🚀 START SERVER
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║  🚀 Mock Backend Server جاهز!                      ║
║  http://localhost:${PORT}                      ║
║                                                    ║
║  ✅ Login: ahmed@example.com / password123        ║
║  ✅ جميع API Endpoints جاهزة                       ║
║  ✅ CORS مفعل                                       ║
╚════════════════════════════════════════════════════╝
  `);
});
