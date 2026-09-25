fn interpolate(template: &str, args: &[&str]) -> String {
    let mut out = template.to_string();
    for arg in args {
        if let Some(index) = out.find("%@") {
            out.replace_range(index..index + 2, arg);
        }
    }
    out
}

fn catalog(lang: &str) -> &'static [(&'static str, &'static str)] {
    if lang == "vi" {
        VI
    } else {
        EN
    }
}

const EN: &[(&str, &str)] = &[
    ("menu.openPanel", "Open Panel"),
    ("menu.openEmptyPanel", "Open Empty Panel"),
    ("menu.checkForUpdates", "Check for Updates…"),
    ("menu.settings", "Settings…"),
    ("menu.quit", "Quit Rewrite Better"),
    ("updater.title", "Rewrite Better"),
    ("updater.available", "Version %@ is available. Install it now?"),
    ("updater.update", "Update"),
    ("updater.later", "Later"),
    ("updater.upToDate", "You’re up to date."),
    ("updater.failed", "Could not check for updates."),
];

const VI: &[(&str, &str)] = &[
    ("menu.openPanel", "Mở bảng"),
    ("menu.openEmptyPanel", "Mở bảng trống"),
    ("menu.checkForUpdates", "Kiểm tra cập nhật…"),
    ("menu.settings", "Cài đặt…"),
    ("menu.quit", "Thoát Rewrite Better"),
    ("updater.title", "Rewrite Better"),
    ("updater.available", "Đã có phiên bản %@. Cài ngay?"),
    ("updater.update", "Cập nhật"),
    ("updater.later", "Để sau"),
    ("updater.upToDate", "Bạn đang dùng bản mới nhất."),
    ("updater.failed", "Không kiểm tra được cập nhật."),
];

pub fn t(key: &str, lang: &str, args: &[&str]) -> String {
    let template = catalog(lang)
        .iter()
        .find(|(item, _)| *item == key)
        .map(|(_, value)| *value)
        .or_else(|| {
            EN.iter()
                .find(|(item, _)| *item == key)
                .map(|(_, value)| *value)
        })
        .unwrap_or(key);
    interpolate(template, args)
}

#[cfg(test)]
mod tests {
    use super::t;

    #[test]
    fn looks_up_tray_and_updater_copy() {
        assert_eq!(t("menu.checkForUpdates", "en", &[]), "Check for Updates…");
        assert_eq!(t("menu.checkForUpdates", "vi", &[]), "Kiểm tra cập nhật…");
        assert_eq!(
            t("updater.available", "en", &["1.2.0"]),
            "Version 1.2.0 is available. Install it now?"
        );
    }
}
