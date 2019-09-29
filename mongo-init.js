
var mails = [
	{"code":"Germany/Africa", "mail":"accounting.lufthansa-germany@icat.dlh.de"},
	{"code":"Europe / Israel", "mail":"Accounting.lufthansa@icat.dlh.de"},
	{"code":"Algeria, Libya, Tunisia", "mail":"tn.fournisseurs@icat.dlh.de"},
	{"code":"Egypt, Jordan, Lebanon", "mail":"eg.accounting.vendors@icat.dlh.de"},
	{"code":"Argentina", "mail":"ar.proveedores@icat.dlh.de"},
	{"code":"United States", "mail":"us.passage.vendors@icat.dlh.de"},
	{"code":"Brazil", "mail":"br.fornecedores@icat.dlh.de"},
	{"code":"Canada", "mail":"ca.accounting.vendors@icat.dlh.de"},
	{"code":"Colombia", "mail":"co.passage.vendors@icat.dlh.de"},
	{"code":"Mexico", "mail":"co.proveedores@icat.dlh.de"},
	{"code":"Asia & Middle east", "mail":"mnl.accountsreceivable@icat.dlh.de"},
	{"code":"Australia", "mail":"au.accounting.vendors@icat.dlh.de"},
	{"code":"China", "mail":"cn.accounting.vendors@icat.dlh.de"},
	{"code":"Hong Kong", "mail":"hk.accounting.vendors@icat.dlh.de"},
	{"code":"India", "mail":"in.accounting.vendors@icat.dlh.de"},
	{"code":"Indonesia", "mail":"id.accounting.vendors@icat.dlh.de"},
	{"code":"Iran", "mail":"ir.accounting.vendors@icat.dlh.de"},
	{"code":"Japan", "mail":"jp.accounting.vendors@icat.dlh.de"},
	{"code":"Korea", "mail":"kr.accounting.vendors@icat.dlh.de"},
	{"code":"Malaysia", "mail":"my.accounting.vendors@icat.dlh.de"},
	{"code":"Morocca", "mail":"ma.fournisseurs@icat.dlh.de"},
	{"code":"New Zealand", "mail":"nz.accounting.vendors@icat.dlh.de"},
	{"code":"Philippines", "mail":"ph.accounting.vendors@icat.dlh.de"},
	{"code":"Singapore", "mail":"sg.accounting.vendors@icat.dlh.de"},
	{"code":"Thailand", "mail":"th.accounting.vendors@icat.dlh.de"},
	{"code":"United Arab Emirates", "mail":"ae.accounting.vendors@icat.dlh.de"},
	{"code":"Vietnam", "mail":"vn.accounting.vendors@icat.dlh.de"}
];
db.createCollection('Email');
db.Email.insertMany(mails);

