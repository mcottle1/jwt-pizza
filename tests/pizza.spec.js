import { test, expect } from 'playwright-test-coverage';

test('home page', async ({ page }) => {
  await page.goto('/');

  expect(await page.title()).toBe('JWT Pizza');
});

test('purchase with login', async ({ page }) => {
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route('*/**/api/franchise', async (route) => {
    const franchiseRes = [
      {
        id: 2,
        name: 'LotaPizza',
        stores: [
          { id: 4, name: 'Lehi' },
          { id: 5, name: 'Springville' },
          { id: 6, name: 'American Fork' },
        ],
      },
      { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
      { id: 4, name: 'topSpot', stores: [] },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/order', async (route) => {
    const orderReq = {
      items: [
        { menuId: 1, description: 'Veggie', price: 0.0038 },
        { menuId: 2, description: 'Pepperoni', price: 0.0042 },
      ],
      storeId: '4',
      franchiseId: 2,
    };
    const orderRes = {
      order: {
        items: [
          { menuId: 1, description: 'Veggie', price: 0.0038 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
        ],
        storeId: '4',
        franchiseId: 2,
        id: 23,
      },
      jwt: 'eyJpYXQ',
    };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });

  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.goto('/');

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible();

  await page.getByRole('button', { name: 'Verify' }).click();
});

test('about', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page.getByText('The secret sauce')).toBeVisible();
  await expect(page.getByText('At JWT Pizza, our amazing')).toBeVisible();
  await expect(page.getByText('Our talented employees at JWT')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Our employees' })).toBeVisible();
  await expect(page.getByText('JWT Pizza is home to a team')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^James$/ }).getByRole('img')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Maria$/ }).getByRole('img')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Anna$/ }).getByRole('img')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Brian$/ }).getByRole('img')).toBeVisible();
  await expect(page.getByText('At JWT Pizza, our employees')).toBeVisible();
  await expect(page.getByRole('main').getByRole('img').first()).toBeVisible();
});

test('adminDashboard login and create franchise', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'a@jwt.com', password: 'admin' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'a@jwt.com', roles: [{ role: 'admin' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/franchise', async (route) => {
    const franchiseReq = { stores: [], name: 'Test Franchise', admins: [{ email: 'admin@example.com' }] };
    const franchiseRes = { name: 'Test Franchise', admins: [{ email: 'admin@example.com', id: 3, name: 'Kai Chen' }], id: 1 }
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toMatchObject(franchiseReq);
      await route.fulfill({ json: franchiseRes });
    }
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: [] });
    }
  });

  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('a@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();

  // Go to admin dashboard
  await page.goto('/admin-dashboard');

  await expect(page.getByText("Mama Ricci's kitchen")).toBeVisible();

  await page.getByRole('button', { name: 'Add Franchise' }).click();

  const createFranchiseSpan = page.locator('span:has-text("Create franchise")');
  await expect(createFranchiseSpan).toBeVisible();  

  await page.fill('input[placeholder="franchise name"]', 'Test Franchise');

  await page.fill('input[placeholder="franchisee admin email"]', 'admin@example.com');

  await page.click('button:has-text("Create")');
});

test('franchiseDashboard', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
  await expect(page.getByText('So you want a piece of the')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^If you are already a franchisee, pleaseloginusing your franchise account$/ }).nth(1)).toBeVisible();
  await expect(page.getByText('Now is the time to get in on')).toBeVisible();
  await expect(page.getByText('Call now')).toBeVisible();
  await expect(page.locator('.bg-neutral-100')).toBeVisible();
  await page.getByRole('heading', { name: 'Unleash Your Potential' }).click();
  await page.getByText('Are you ready to embark on a').click();
  await page.getByRole('link', { name: '-555-5555' }).click();
});

test('register', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const registerReq = { name: 'test', email: 'test@gmail.com', password: '12345' };
    const registerRes = { user: { id: 2, name: 'pizza diner', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'tttttt' };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(registerReq);
    await route.fulfill({ json: registerRes });
  });

  await page.goto('/');

  await page.getByRole('link', { name: 'Register' }).click();

  await page.getByPlaceholder('Full name').click();
  await page.getByPlaceholder('Full name').fill('test');
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('test@gmail.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('12345');
  await page.getByRole('button', { name: 'Register' }).click();
});

test('logout', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
    const logoutRes = { message: 'logout successful' };
    if(route.request().method() === 'PUT') {
      expect(route.request().method()).toBe('PUT');
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    }
    if(route.request().method() === 'DELETE') {
      await route.fulfill({ json: logoutRes });
    }
  });

  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'Logout' }).click();

});

test('dinerDashboard', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
    if(route.request().method() === 'PUT') {
      expect(route.request().method()).toBe('PUT');
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    }
  });

  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.goto('/diner-dashboard');

  await expect(page.getByText("Your pizza kitchen")).toBeVisible();
});

test('history', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'History' }).click();

  await expect(page.getByText("Mama Rucci, my my")).toBeVisible();
});

test('docs', async ({ page }) => {
  await page.goto('/docs');

  await expect(page.getByText("JWT Pizza API")).toBeVisible();
});

test('adminDashboard login and delete franchise', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'a@jwt.com', password: 'admin' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'a@jwt.com', roles: [{ role: 'admin' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/franchise', async (route) => {
    const getFranchiseRes = [{ id: 1, name: 'pizzaPocket', admins: [{ id: 3, name: 'Kai Chen', email: 'a@jwt.com' }], stores: [{ id: 1, name: 'SLC', totalRevenue: 0 }] }];
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: getFranchiseRes });
    }
  });

  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('a@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();

  // Go to admin dashboard
  await page.goto('/admin-dashboard');

  await expect(page.getByText("Mama Ricci's kitchen")).toBeVisible();

  await page.click('button.text-orange-400 >> nth=0');
});

test('create store', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'a@jwt.com', password: 'admin' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'a@jwt.com', roles: [{ role: 'admin' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/franchise', async (route) => {
    const getFranchiseRes = [{ id: 1, name: 'pizzaPocket', admins: [{ id: 3, name: 'Kai Chen', email: 'a@jwt.com' }], stores: [{ id: 1, name: 'SLC', totalRevenue: 0 }] }];
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: getFranchiseRes });
    }
  });

  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('a@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();

  // Go to admin dashboard
  await page.goto('/admin-dashboard');

  await expect(page.getByText("Mama Ricci's kitchen")).toBeVisible();

  await page.goto('/admin-dashboard/create-store');

  await expect(page.getByText("Create store")).toBeVisible();

  await page.fill('input[placeholder="store name"]', 'test store');

  await page.getByRole('button', { name: 'Create' }).click();
});

test('franchise dashboard cont', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'a@jwt.com', password: 'admin' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'a@jwt.com', roles: [{ role: 'admin' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/franchise/3', async (route) => {
    const getFranchiseRes = [{ id: 1, name: 'pizzaPocket', admins: [{ id: 3, name: 'Kai Chen', email: 'a@jwt.com' }], stores: [{ id: 1, name: 'SLC', totalRevenue: 0 }] }];
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: getFranchiseRes });
    }
  });

  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('a@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();

  // Go to admin dashboard
  await page.goto('/franchise-dashboard');
});

test('diner dashboard cont', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'a@jwt.com', password: 'admin' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'a@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/order', async (route) => {
    const getOrderRes = { dinerId: 4, orders: [{ id: 1, franchiseId: 1, storeId: 1, date: '2024-06-05T05:14:40.000Z', items: [{ id: 1, menuId: 1, description: 'Veggie', price: 0.05 }] }], page: 1 };
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: getOrderRes });
    }
  });

  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('a@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();

  // Go to diner dashboard
  await page.goto('/diner-dashboard');

  await expect(page.getByText("Here is your history of all the good times.")).toBeVisible();
});

test('purchase with login cancel', async ({ page }) => {
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route('*/**/api/franchise', async (route) => {
    const franchiseRes = [
      {
        id: 2,
        name: 'LotaPizza',
        stores: [
          { id: 4, name: 'Lehi' },
          { id: 5, name: 'Springville' },
          { id: 6, name: 'American Fork' },
        ],
      },
      { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
      { id: 4, name: 'topSpot', stores: [] },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/order', async (route) => {
    const orderReq = {
      items: [
        { menuId: 1, description: 'Veggie', price: 0.0038 },
        { menuId: 2, description: 'Pepperoni', price: 0.0042 },
      ],
      storeId: '4',
      franchiseId: 2,
    };
    const orderRes = {
      order: {
        items: [
          { menuId: 1, description: 'Veggie', price: 0.0038 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
        ],
        storeId: '4',
        franchiseId: 2,
        id: 23,
      },
      jwt: 'eyJpYXQ',
    };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });

  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.goto('/');

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Cancel' }).click();

});

test('purchase with login payment process fail', async ({ page }) => {
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route('*/**/api/franchise', async (route) => {
    const franchiseRes = [
      {
        id: 2,
        name: 'LotaPizza',
        stores: [
          { id: 4, name: 'Lehi' },
          { id: 5, name: 'Springville' },
          { id: 6, name: 'American Fork' },
        ],
      },
      { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
      { id: 4, name: 'topSpot', stores: [] },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/order', async (route) => {
    const orderReq = {
      items: [
        { menuId: 1, description: 'Veggie', price: 0.0038 },
        { menuId: 2, description: 'Pepperoni', price: 0.0042 },
      ],
      storeId: '4',
      franchiseId: 2,
    };
    const orderRes = { message: 'Internal server error' };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });

  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.goto('/');

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

});
