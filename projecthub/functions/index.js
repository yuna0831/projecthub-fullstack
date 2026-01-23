/**
 * Firebase Functions v2 Template (기본)
 */

const { setGlobalOptions } = require("firebase-functions");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

// SendGrid API Key 가져오기
sgMail.setApiKey(process.env.SENDGRID_API_KEY || require("firebase-functions").config().sendgrid.key);

/**
 * 🔥 승인 시 이메일 발송 Trigger
 *
 * recruitPosts/{projectId}/applications/{appId}
 */
exports.sendApprovalEmail = onDocumentUpdated(
  "recruitPosts/{projectId}/applications/{appId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const { projectId } = event.params;

    // 상태가 approved로 변경되는 순간에만 실행
    if (before.status !== "approved" && after.status === "approved") {
      const email = after.userEmail;
      const name = after.name;

      const msg = {
        to: email,
        from: "YOUR_FROM_EMAIL@example.com", // ❗반드시 너의 인증된 이메일로 바꾸기
        subject: "🎉 Your Application Has Been Approved!",
        text: `Hi ${name},\n\nYour application to join the project (ID: ${projectId}) has been approved!\n\nWelcome to the team 🎉`,
      };

      await sgMail.send(msg);
      console.log("📧 Approval email sent to:", email);
    }
  }
);
