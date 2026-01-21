return (
  <div className="login-wrapper">
    <Card className="login-card">
      <Title level={3} style={{ textAlign: "center" }}>
        Login
      </Title>

      <Input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      <Input.Password
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      <Button type="primary" block onClick={handleLocalLogin}>
        Login
      </Button>

      <Divider>OR</Divider>

      <Button block onClick={handleSSOLogin}>
        Sign in with SSO
      </Button>
    </Card>
  </div>
);
