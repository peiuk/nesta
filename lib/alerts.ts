const email=/^[^\s@]+@[^\s@]+$/;
function clean(list:string[]){
 return [...new Set(list.map(value=>value.trim().toLowerCase()).filter(value=>email.test(value)))];
}

/** Coordinators on the case, otherwise the configured admin addresses. */
export function alertRecipients(coordinatorEmails:string[],adminEmails:string[]){
 const coordinators=clean(coordinatorEmails);
 return coordinators.length?coordinators:clean(adminEmails);
}

export function profileSubmittedAlert(name:string){
 return {subject:'Nesta: profile awaiting approval',text:`${name} submitted a profile and is awaiting approval.\n\nNesta\nnestafamily.com`};
}

export function questionAlert(caseCode:string){
 return {subject:`Nesta: unanswered message on ${caseCode}`,text:`Case ${caseCode} has an unanswered client message. The message body is not included in this email.`};
}
