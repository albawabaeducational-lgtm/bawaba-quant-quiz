-- صلاحيات تفصيلية لكل حساب (صف لكل صلاحية). يُنشأ تلقائيًا أيضًا عند أول دخول للوحة التحكم،
-- وتُحوَّل الصلاحيات القديمة (staff_permissions) إليه مرة واحدة تلقائيًا.
CREATE TABLE IF NOT EXISTS staff_perms (
  staff_id INTEGER NOT NULL,
  perm TEXT NOT NULL,
  PRIMARY KEY (staff_id, perm)
);
