# Doron System - 公開テストURL

## 🌐 公開URL (最新デプロイ)

**デプロイ日時**: 2026-01-10

### メインアプリケーションURL
```
https://script.google.com/macros/s/AKfycbzSjGI0m_qt0sioRoNonfsHenGzOmU9yNS4HS0m6bavvmZg1vl_8GUf5UsaaNHXKccT1Q/exec
```

このURLをブラウザで開くと、Doronシステムのセットアップ画面が表示されます。

---

## 📋 デプロイ情報

| デプロイID | バージョン | 説明 |
|-----------|----------|------|
| `AKfycbzSjGI0m_qt0sioRoNonfsHenGzOmU9yNS4HS0m6bavvmZg1vl_8GUf5UsaaNHXKccT1Q` | @7 | **最新** - Public Test Deployment |
| `AKfycbyIyp9LeHd4G6Kwo2MGePvmf1EKP2yBcOm9-O4YKhU6` | @HEAD | 開発版 (HEAD) |

---

## 🔧 LINE連携設定

このURLを以下の場所に設定してください:

### 1. LINE Messaging API - Webhook URL
```
https://script.google.com/macros/s/AKfycbzSjGI0m_qt0sioRoNonfsHenGzOmU9yNS4HS0m6bavvmZg1vl_8GUf5UsaaNHXKccT1Q/exec
```

### 2. LINE Login - Callback URL
```
https://script.google.com/macros/s/AKfycbzSjGI0m_qt0sioRoNonfsHenGzOmU9yNS4HS0m6bavvmZg1vl_8GUf5UsaaNHXKccT1Q/exec
```

---

## 🚀 テスト手順

1. **セットアップページにアクセス**
   - 上記の公開URLをブラウザで開く
   - LINEログインボタンが表示されることを確認

2. **LINE連携テスト**
   - 「連携する」ボタンをクリック
   - LINE認証画面にリダイレクトされることを確認
   - 認証後、正常にコールバックされることを確認

3. **フォーム送信テスト**
   - Googleフォームから送信
   - 24時間後のトリガーが設定されることを確認

---

## 🔄 更新方法

コードを更新した後、以下のコマンドで再デプロイ:

```bash
# コードをプッシュ
clasp push

# 新しいデプロイを作成
clasp deploy --description "更新内容の説明"

# または既存のデプロイを更新
clasp deploy --deploymentId AKfycbzSjGI0m_qt0sioRoNonfsHenGzOmU9yNS4HS0m6bavvmZg1vl_8GUf5UsaaNHXKccT1Q
```

---

## 📱 QRコード

テスト用にQRコードを生成する場合:
```
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://script.google.com/macros/s/AKfycbzSjGI0m_qt0sioRoNonfsHenGzOmU9yNS4HS0m6bavvmZg1vl_8GUf5UsaaNHXKccT1Q/exec
```

---

**注意**: このURLは誰でもアクセス可能です。本番環境では適切なアクセス制御を設定してください。
