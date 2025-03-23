/**
 * Mock implementation of next/server for testing
 */

class Headers {
  constructor(init) {
    this._headers = new Map();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.set(key, value);
      });
    }
  }

  get(name) {
    return this._headers.get(name) || null;
  }

  set(name, value) {
    this._headers.set(name, value);
  }

  has(name) {
    return this._headers.has(name);
  }

  forEach(callback) {
    this._headers.forEach((value, key) => callback(value, key));
  }
}

class NextRequest {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? new URL(input) : input;
    this.method = init.method || 'GET';
    this.headers = new Headers(init.headers);
    this.nextUrl = this.url;
    this.json = jest.fn().mockResolvedValue({});
  }
}

class NextResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = new Headers(init.headers);
  }

  static json(data, init) {
    const response = new NextResponse(JSON.stringify(data), init);
    response.headers.set('content-type', 'application/json');
    response.json = () => Promise.resolve(data);
    return response;
  }
}

module.exports = {
  NextRequest,
  NextResponse,
  headers: () => new Headers(),
}; 