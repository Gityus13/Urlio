cask "urlio" do
  version "1.0.0"
  # After publishing a release on GitHub, update the sha256 below.
  # Run: shasum -a 256 URLio-1.0.0-arm64.dmg
  sha256 "REPLACE_WITH_SHA256_OF_YOUR_DMG"

  url "https://github.com/YOUR_GITHUB_USERNAME/urlio/releases/download/v#{version}/URLio-#{version}-arm64.dmg"
  name "URLio"
  desc "Beautiful URL shortener and expander desktop app"
  homepage "https://github.com/YOUR_GITHUB_USERNAME/urlio"

  app "URLio.app"

  zap trash: [
    "~/Library/Application Support/urlio",
    "~/Library/Preferences/com.urlio.app.plist",
    "~/Library/Logs/URLio",
  ]
end
