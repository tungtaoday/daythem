import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import { IconChevron } from '../../components/icons';

// ── Static sub-components ─────────────────────────────────────

function Heading({ children }: { children: string }) {
  return <Text style={s.heading}>{children}</Text>;
}

function Body({ children }: { children: React.ReactNode }) {
  return <Text style={s.body}>{children}</Text>;
}

// ── Main screen ───────────────────────────────────────────────

export function LegalScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={s.container}>
      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconChevron size={20} color={colors.textPrimary} />
          </View>
        </TouchableOpacity>
        <Text style={s.topTitle}>Điều khoản & bảo mật</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 48 + insets.bottom }}
      >
        <Text style={s.intro}>
          GieoChữ là ứng dụng giúp giáo viên cá nhân quản lý lớp dạy thêm: điểm danh,
          học phí, thông báo và báo cáo cho phụ huynh. Trang này giải thích rõ ràng
          quyền và nghĩa vụ của bạn khi dùng ứng dụng, cũng như cách chúng tôi xử lý
          dữ liệu.
        </Text>
        <Text style={s.updated}>Cập nhật lần cuối: 07/2026</Text>

        {/* ── ĐIỀU KHOẢN SỬ DỤNG ── */}
        <Text style={s.docTitle}>Điều khoản sử dụng</Text>

        <Heading>1. Chấp nhận điều khoản</Heading>
        <Body>
          Khi tạo tài khoản và sử dụng GieoChữ, bạn đồng ý với các điều khoản dưới đây.
          Nếu không đồng ý, vui lòng ngừng sử dụng ứng dụng.
        </Body>

        <Heading>2. Tài khoản của bạn</Heading>
        <Body>
          Số điện thoại là tên đăng nhập của bạn và không thể thay đổi trong ứng dụng.
          Bạn chịu trách nhiệm giữ bí mật mật khẩu và mọi hoạt động diễn ra trong tài
          khoản của mình. Vui lòng dùng mật khẩu đủ mạnh và không chia sẻ cho người khác.
        </Body>

        <Heading>3. Trách nhiệm khi nhập dữ liệu</Heading>
        <Body>
          Bạn là người nhập và quản lý thông tin học sinh, phụ huynh và học phí. Bạn có
          trách nhiệm bảo đảm mình được phép lưu giữ những thông tin này và sử dụng chúng
          đúng mục đích dạy học, thu học phí. GieoChữ chỉ là công cụ hỗ trợ ghi chép,
          không thay bạn quyết định về mối quan hệ với học sinh hay phụ huynh.
        </Body>

        <Heading>4. Sử dụng hợp lệ</Heading>
        <Body>
          Không dùng ứng dụng vào mục đích vi phạm pháp luật, quấy rối, hoặc thu thập
          dữ liệu của người khác mà không được phép. Chúng tôi có thể tạm khoá tài khoản
          nếu phát hiện hành vi lạm dụng.
        </Body>

        <Heading>5. Tính năng thuế</Heading>
        <Body>
          Công cụ tính thuế thu nhập cá nhân và tờ khai 09/KK-TNCN chỉ mang tính tham
          khảo, giúp bạn ước tính. Bạn nên tự kiểm tra lại với quy định hiện hành hoặc
          cơ quan thuế trước khi kê khai chính thức. GieoChữ không chịu trách nhiệm pháp
          lý cho các con số bạn kê khai.
        </Body>

        <Heading>6. Thay đổi & giới hạn trách nhiệm</Heading>
        <Body>
          Ứng dụng đang trong giai đoạn phát triển (Beta). Tính năng có thể thay đổi và
          đôi khi có lỗi. Chúng tôi cố gắng giữ dữ liệu an toàn nhưng khuyến khích bạn
          xuất Excel để sao lưu những thông tin quan trọng.
        </Body>

        {/* ── CHÍNH SÁCH BẢO MẬT ── */}
        <Text style={[s.docTitle, { marginTop: 32 }]}>Chính sách bảo mật</Text>

        <Heading>1. Dữ liệu chúng tôi thu thập</Heading>
        <Body>
          • Số điện thoại và tên của bạn (để đăng nhập và hiển thị hồ sơ).{'\n'}
          • Dữ liệu bạn tự nhập: lớp học, danh sách học sinh, tên phụ huynh, số điện
          thoại phụ huynh, điểm danh, học phí, thông báo và báo cáo.{'\n'}
          • Thông tin phục vụ tính thuế (nếu bạn dùng tính năng thuế).{'\n'}
          • Email và tài khoản ngân hàng (nếu bạn nhập) được lưu ngay trên máy của bạn.
        </Body>

        <Heading>2. Nơi lưu trữ & ai truy cập được</Heading>
        <Body>
          Dữ liệu lớp và học sinh được lưu trên máy chủ của ứng dụng. Chỉ tài khoản
          giáo viên đã đăng nhập mới xem được dữ liệu của mình — học sinh, phụ huynh hay
          giáo viên khác không thấy dữ liệu của bạn. Chúng tôi không bán dữ liệu của bạn
          cho bên thứ ba.
        </Body>

        <Heading>3. Về Zalo</Heading>
        <Body>
          GieoChữ giúp bạn soạn sẵn tin nhắn để gửi qua Zalo (thông báo nghỉ, học phí,
          báo cáo). Ứng dụng KHÔNG đọc tin nhắn riêng tư trên Zalo của bạn và không truy
          cập vào danh bạ hay lịch sử trò chuyện. Bạn là người chủ động sao chép và gửi
          tin nhắn.
        </Body>

        <Heading>4. Chia sẻ với phụ huynh</Heading>
        <Body>
          Khi bạn gửi tin nhắn học phí hoặc báo cáo, thông tin trong tin nhắn đó (ví dụ
          tài khoản ngân hàng, số buổi học) sẽ hiển thị cho phụ huynh mà bạn gửi. Hãy cân
          nhắc nội dung trước khi gửi.
        </Body>

        <Heading>5. Xoá tài khoản & dữ liệu</Heading>
        <Body>
          Bạn có thể xoá tài khoản bất cứ lúc nào tại: Hồ sơ → Xoá tài khoản. Khi xoá,
          toàn bộ lớp, học sinh, điểm danh và học phí của bạn sẽ bị xoá vĩnh viễn khỏi
          máy chủ và không thể khôi phục. Hãy xuất Excel để sao lưu trước nếu cần.
        </Body>

        <Heading>6. Liên hệ</Heading>
        <Body>
          Nếu có thắc mắc về điều khoản hoặc quyền riêng tư, vui lòng liên hệ:
          {'\n'}support@gieochu.vn
        </Body>

        <Text style={s.footerNote}>
          Cảm ơn bạn đã tin tưởng GieoChữ để đồng hành cùng lớp học của mình. 🌿
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  topTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: 'white', borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  intro: { fontSize: 15, lineHeight: 23, color: colors.textPrimary },
  updated: { fontSize: 13, color: colors.textMuted, marginTop: 10 },

  docTitle: {
    fontSize: 20, fontWeight: '700', color: colors.textPrimary,
    marginTop: 24, marginBottom: 4, letterSpacing: -0.3,
  },
  heading: {
    fontSize: 16, fontWeight: '700', color: colors.green700,
    marginTop: 20, marginBottom: 6,
  },
  body: { fontSize: 15, lineHeight: 23, color: colors.textPrimary },

  footerNote: {
    fontSize: 14, color: colors.textSecondary, textAlign: 'center',
    lineHeight: 21, marginTop: 32,
  },
});
